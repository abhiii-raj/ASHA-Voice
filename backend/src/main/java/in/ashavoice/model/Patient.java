package in.ashavoice.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document("patients")
public record Patient(@Id String id, String name, Integer age, String village) {}
