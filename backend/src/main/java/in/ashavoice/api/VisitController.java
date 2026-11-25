package in.ashavoice.api;

import in.ashavoice.model.Patient;
import in.ashavoice.model.Visit;
import in.ashavoice.model.Worker;
import in.ashavoice.repository.PatientRepository;
import in.ashavoice.repository.VisitRepository;
import in.ashavoice.repository.WorkerRepository;
import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api")
public class VisitController {
    private final VisitRepository visits;
    private final PatientRepository patients;
    private final WorkerRepository workers;
    private final SimpMessagingTemplate messages;

    public VisitController(
        VisitRepository visits,
        PatientRepository patients,
        WorkerRepository workers,
        SimpMessagingTemplate messages
    ) {
        this.visits = visits;
        this.patients = patients;
        this.workers = workers;
        this.messages = messages;
    }

    @GetMapping("/visits")
    public List<Visit> getVisits(Authentication authentication) {
        boolean supervisor = authentication.getAuthorities().stream()
            .anyMatch(authority -> authority.getAuthority().equals("ROLE_SUPERVISOR"));
        return supervisor ? visits.findAll().stream()
            .sorted(Comparator.comparing(Visit::createdAt).reversed()).toList()
            : visits.findByWorkerIdOrderByCreatedAtDesc(authentication.getName());
    }

    @PostMapping("/visits")
    public Visit createVisit(@RequestBody Visit incoming, Authentication authentication) {
        String workerId = hasRole(authentication, "ROLE_SUPERVISOR") ? incoming.workerId() : authentication.getName();
        Worker worker = workers.findById(workerId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Worker not found"));
        Visit saved = applyRiskRule(new Visit(
            incoming.id() == null || incoming.id().isBlank() ? java.util.UUID.randomUUID().toString() : incoming.id(),
            worker.id(), incoming.patientId(), incoming.patientName(), worker.name(), worker.village(),
            incoming.type(), incoming.age(), incoming.vitals(), incoming.symptoms(), incoming.riskFlag(),
            incoming.followUpDate(), incoming.transcript(), true, Instant.now(), "synced", incoming.notes()
        ));
        Visit persisted = visits.save(saved);
        messages.convertAndSend("/topic/visits", persisted);
        return persisted;
    }

    @PutMapping("/visits/{id}")
    public Visit updateVisit(@PathVariable String id, @RequestBody Visit incoming, Authentication authentication) {
        Visit existing = ownedVisit(id, authentication);
        Visit updated = applyRiskRule(new Visit(
            existing.id(), existing.workerId(), incoming.patientId(), incoming.patientName(), existing.workerName(),
            existing.village(), incoming.type(), incoming.age(), incoming.vitals(), incoming.symptoms(),
            incoming.riskFlag(), incoming.followUpDate(), incoming.transcript(), incoming.confirmed(),
            existing.createdAt(), "synced", incoming.notes()
        ));
        Visit persisted = visits.save(updated);
        messages.convertAndSend("/topic/visits", persisted);
        return persisted;
    }

    @DeleteMapping("/visits/{id}")
    public void deleteVisit(@PathVariable String id, Authentication authentication) {
        Visit visit = ownedVisit(id, authentication);
        if (visit.createdAt().isBefore(Instant.now().minus(24, ChronoUnit.HOURS))) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Visits can only be deleted within 24 hours");
        }
        visits.delete(visit);
        messages.convertAndSend("/topic/visits", Map.of("deletedId", id));
    }

    @GetMapping("/patients")
    public List<Patient> getPatients() {
        return patients.findAll();
    }

    @GetMapping("/workers")
    public List<Worker> getWorkers() {
        return workers.findAll();
    }

    @GetMapping("/supervisor/metrics")
    public Map<String, Long> metrics() {
        Instant startOfDay = LocalDate.now().atStartOfDay(java.time.ZoneId.systemDefault()).toInstant();
        return Map.of(
            "visitsToday", visits.countByCreatedAtAfter(startOfDay),
            "flagged", visits.countByRiskFlag("needs review")
        );
    }

    private Visit ownedVisit(String id, Authentication authentication) {
        Visit visit = visits.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Visit not found"));
        if (!hasRole(authentication, "ROLE_SUPERVISOR") && !visit.workerId().equals(authentication.getName())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "This visit belongs to another worker");
        }
        return visit;
    }

    private Visit applyRiskRule(Visit visit) {
        if (!"pregnancy".equalsIgnoreCase(visit.type()) || visit.vitals() == null) return visit;
        String bp = visit.vitals().get("bp");
        if (bp == null) return visit;
        String[] parts = bp.split("[/]");
        if (parts.length != 2) return visit;
        try {
            if (Integer.parseInt(parts[0].trim()) >= 140 || Integer.parseInt(parts[1].trim()) >= 90) {
                return new Visit(
                    visit.id(), visit.workerId(), visit.patientId(), visit.patientName(), visit.workerName(),
                    visit.village(), visit.type(), visit.age(), visit.vitals(), visit.symptoms(), "needs review",
                    visit.followUpDate(), visit.transcript(), visit.confirmed(), visit.createdAt(),
                    visit.syncStatus(), visit.notes()
                );
            }
        } catch (NumberFormatException ignored) {
            return visit;
        }
        return visit;
    }

    private boolean hasRole(Authentication authentication, String role) {
        return authentication.getAuthorities().stream()
            .anyMatch(authority -> authority.getAuthority().equals(role));
    }
}
