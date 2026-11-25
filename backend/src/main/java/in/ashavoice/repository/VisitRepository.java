package in.ashavoice.repository;

import in.ashavoice.model.Visit;
import java.time.Instant;
import java.util.List;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface VisitRepository extends MongoRepository<Visit, String> {
    List<Visit> findByCreatedAtAfterOrderByCreatedAtDesc(Instant createdAt);
    List<Visit> findByWorkerIdOrderByCreatedAtDesc(String workerId);
    long countByCreatedAtAfter(Instant createdAt);
    long countByRiskFlag(String riskFlag);
}
