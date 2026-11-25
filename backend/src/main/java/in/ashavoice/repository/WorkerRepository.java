package in.ashavoice.repository;

import in.ashavoice.model.Worker;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface WorkerRepository extends MongoRepository<Worker, String> {}
