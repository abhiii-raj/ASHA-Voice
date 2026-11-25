package in.ashavoice.api;

import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/voice")
public class VoiceController {
    private final VoiceIntelligenceService voiceIntelligence;

    public VoiceController(VoiceIntelligenceService voiceIntelligence) {
        this.voiceIntelligence = voiceIntelligence;
    }

    @PostMapping(value = "/structure", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public VoiceIntelligenceService.StructuredTranscript structure(@RequestPart("audio") MultipartFile audio) {
        return voiceIntelligence.structure(audio);
    }
}
