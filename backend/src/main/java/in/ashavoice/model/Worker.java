package in.ashavoice.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document("workers")
public record Worker(@Id String id, String name, String village) {}
