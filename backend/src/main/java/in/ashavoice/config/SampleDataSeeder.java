package in.ashavoice.config;

import in.ashavoice.model.Patient;
import in.ashavoice.model.Visit;
import in.ashavoice.model.Worker;
import in.ashavoice.repository.PatientRepository;
import in.ashavoice.repository.VisitRepository;
import in.ashavoice.repository.WorkerRepository;
import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class SampleDataSeeder {
    private static final List<Worker> WORKERS = List.of(
        new Worker("w1", "Meera Kumari", "Rampur"),
        new Worker("w2", "Poonam Devi", "Bairiya"),
        new Worker("w3", "Gurpreet Kaur", "Chandpur")
    );
    private static final List<String> NAMES = List.of(
        "Sunita Devi", "Rekha Kumari", "Asha Yadav", "Kavita Singh", "Pooja Devi",
        "Suman Patel", "Rani Kumari", "Neha Sharma", "Anita Devi", "Meena Yadav",
        "Ritu Singh", "Geeta Kumari", "Sakshi Devi", "Nisha Patel", "Mamta Yadav",
        "Priya Kumari", "Sita Devi", "Komal Singh", "Jyoti Sharma", "Shanti Devi"
    );

    @Bean
    CommandLineRunner seedSampleData(WorkerRepository workers, PatientRepository patients, VisitRepository visits) {
        return args -> {
            if (workers.count() == 0) workers.saveAll(WORKERS);
            if (patients.count() == 0) {
                var patientRecords = java.util.stream.IntStream.range(0, NAMES.size())
                    .mapToObj(index -> new Patient(
                        "p" + (index + 1),
                        NAMES.get(index),
                        new int[] {24, 28, 19, 32, 26, 30, 22, 27, 35, 21}[index % 10],
                        WORKERS.get(index % WORKERS.size()).village()
                    )).toList();
                patients.saveAll(patientRecords);
            }
            if (visits.count() == 0) {
                var patientRecords = patients.findAll();
                var sampleVisits = java.util.stream.IntStream.range(0, 30).mapToObj(index -> {
                    Patient patient = patientRecords.get(index % patientRecords.size());
                    Worker worker = WORKERS.get(index % WORKERS.size());
                    String type = List.of("pregnancy", "newborn", "immunization", "general").get(index % 4);
                    boolean flagged = "pregnancy".equals(type) && index % 7 == 0;
                    return new Visit(
                        "v" + (index + 1), worker.id(), patient.id(), patient.name(), worker.name(), worker.village(),
                        type, patient.age(), flagged ? Map.of("bp", "140/90") : Map.of(),
                        index % 4 == 3 ? "सिर दर्द" : null, flagged ? "needs review" : "",
                        LocalDate.now().plusDays(index % 5 + 1), null, true,
                        Instant.now().minus(index % 9, ChronoUnit.DAYS), index % 8 == 0 ? "pending" : "synced", null
                    );
                }).toList();
                visits.saveAll(sampleVisits);
            }
        };
    }
}
