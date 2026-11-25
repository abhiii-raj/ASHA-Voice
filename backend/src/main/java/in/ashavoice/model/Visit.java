package in.ashavoice.model;

import java.time.Instant;
import java.time.LocalDate;
import java.util.Map;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document("visits")
public record Visit(
    @Id String id,
    String workerId,
    String patientId,
    String patientName,
    String workerName,
    String village,
    String type,
    Integer age,
    Map<String, String> vitals,
    String symptoms,
    String riskFlag,
    LocalDate followUpDate,
    String transcript,
    Boolean confirmed,
    Instant createdAt,
    String syncStatus,
    String notes
) {}
