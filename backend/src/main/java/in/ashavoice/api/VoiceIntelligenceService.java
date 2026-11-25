package in.ashavoice.api;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.MultiValueMap;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.multipart.MultipartFile;

@Service
public class VoiceIntelligenceService {
    private final RestClient restClient = RestClient.create();
    private final ObjectMapper objectMapper;
    private final String speechUrl;
    private final String speechKey;
    private final String languageModelUrl;
    private final String languageModelKey;

    public VoiceIntelligenceService(
        ObjectMapper objectMapper,
        @Value("${asha.stt.url:}") String speechUrl,
        @Value("${asha.stt.api-key:}") String speechKey,
        @Value("${asha.llm.url:}") String languageModelUrl,
        @Value("${asha.llm.api-key:}") String languageModelKey
    ) {
        this.objectMapper = objectMapper;
        this.speechUrl = speechUrl;
        this.speechKey = speechKey;
        this.languageModelUrl = languageModelUrl;
        this.languageModelKey = languageModelKey;
    }

    public StructuredTranscript structure(MultipartFile audio) {
        if (speechUrl.isBlank() || languageModelUrl.isBlank() || speechKey.isBlank() || languageModelKey.isBlank()) {
            throw new ResponseStatusException(
                HttpStatus.SERVICE_UNAVAILABLE,
                "Configure ASHA_STT_URL, ASHA_STT_API_KEY, ASHA_LLM_URL, and ASHA_LLM_API_KEY to enable server transcription"
            );
        }
        try {
            String transcript = transcribe(audio);
            JsonNode fields = extractFields(transcript);
            return new StructuredTranscript(transcript, fields);
        } catch (ResponseStatusException exception) {
            throw exception;
        } catch (Exception exception) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Voice processing service failed", exception);
        }
    }

    private String transcribe(MultipartFile audio) throws Exception {
        ByteArrayResource file = new ByteArrayResource(audio.getBytes()) {
            @Override
            public String getFilename() {
                return audio.getOriginalFilename() == null ? "visit-audio.webm" : audio.getOriginalFilename();
            }
        };
        MultiValueMap<String, Object> form = new LinkedMultiValueMap<>();
        form.add("audio", file);
        form.add("language", "hi-IN,en-IN");
        JsonNode response = restClient.post()
            .uri(speechUrl)
            .header("Authorization", "Bearer " + speechKey)
            .contentType(MediaType.MULTIPART_FORM_DATA)
            .body(form)
            .retrieve()
            .body(JsonNode.class);
        String text = response == null ? null : response.path("text").asText(null);
        if (text == null || text.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Speech service returned no transcript");
        }
        return text;
    }

    private JsonNode extractFields(String transcript) throws Exception {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("temperature", 0);
        payload.put("messages", List.of(
            Map.of(
                "role", "system",
                "content", "Extract only facts explicitly present in this Hindi, English, or Hinglish visit transcript. Never infer, normalize a missing value, diagnose, or add medical advice. Return null for every unmentioned field. Keep the patient's words as symptoms."
            ),
            Map.of("role", "user", "content", transcript)
        ));
        payload.put("response_format", Map.of(
            "type", "json_schema",
            "json_schema", Map.of("name", "asha_visit", "strict", true, "schema", schema())
        ));
        JsonNode response = restClient.post()
            .uri(languageModelUrl)
            .header("Authorization", "Bearer " + languageModelKey)
            .contentType(MediaType.APPLICATION_JSON)
            .body(payload)
            .retrieve()
            .body(JsonNode.class);
        String content = response == null ? null : response.path("choices").path(0).path("message").path("content").asText(null);
        if (content == null || content.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Language model returned no structured visit");
        }
        JsonNode result = objectMapper.readTree(content);
        if (!result.isObject() || !result.has("patientName") || !result.has("type") || !result.has("vitals")) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Language model response did not match the visit schema");
        }
        return result;
    }

    private Map<String, Object> schema() {
        Map<String, Object> nullableString = Map.of("type", List.of("string", "null"));
        Map<String, Object> nullableInteger = Map.of("type", List.of("integer", "null"));
        Map<String, Object> vitals = Map.of(
            "type", "object",
            "properties", Map.of(
                "bp", nullableString,
                "weight", nullableString,
                "temperature", nullableString
            ),
            "required", List.of("bp", "weight", "temperature"),
            "additionalProperties", false
        );
        return Map.of(
            "type", "object",
            "properties", Map.of(
                "patientName", nullableString,
                "age", nullableInteger,
                "type", Map.of("type", List.of("string", "null"), "enum", List.of("pregnancy", "newborn", "immunization", "general", null)),
                "vitals", vitals,
                "symptoms", nullableString,
                "followUpDate", nullableString,
                "notes", nullableString
            ),
            "required", List.of("patientName", "age", "type", "vitals", "symptoms", "followUpDate", "notes"),
            "additionalProperties", false
        );
    }

    public record StructuredTranscript(String transcript, JsonNode fields) {}
}
