package com.jobportal.config;

import com.jobportal.model.*;
import com.jobportal.repository.*;
import com.jobportal.service.FileStorageService;
import com.jobportal.service.FileStorageService.StoredFile;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/** Creates the bootstrap admin, and (optionally) demo employers, jobs and a job seeker on an empty database. */
@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);
    private static final String DEMO_PASSWORD = "Password@123";

    private final UserRepository userRepository;
    private final CompanyRepository companyRepository;
    private final JobRepository jobRepository;
    private final SeekerProfileRepository profileRepository;
    private final JobApplicationRepository applicationRepository;
    private final PasswordEncoder passwordEncoder;
    private final FileStorageService fileStorageService;

    @Value("${app.admin.email}")
    private String adminEmail;
    @Value("${app.admin.password}")
    private String adminPassword;
    @Value("${app.seed-demo}")
    private boolean seedDemo;

    @Override
    @Transactional
    public void run(String... args) {
        if (!userRepository.existsByEmailIgnoreCase(adminEmail)) {
            user(adminEmail, adminPassword, "Platform Admin", Role.ADMIN);
            log.info("Created admin account {}", adminEmail);
        }
        if (seedDemo && jobRepository.count() == 0 && !userRepository.existsByEmailIgnoreCase("employer@demo.com")) {
            seedDemoData();
            log.info("Seeded demo data (employer@demo.com / seeker@demo.com, password {})", DEMO_PASSWORD);
        }
    }

    private void seedDemoData() {
        User acmeOwner = user("employer@demo.com", DEMO_PASSWORD, "Alice Morgan", Role.EMPLOYER);
        Company acme = company(acmeOwner, "Acme Technologies", "Software", "San Francisco, CA", "201-500",
                "https://acme.example.com",
                "Acme builds developer tools and cloud infrastructure used by thousands of engineering teams.");

        User globexOwner = user("hr@globex.demo", DEMO_PASSWORD, "Brian Chen", Role.EMPLOYER);
        Company globex = company(globexOwner, "Globex Corporation", "Finance", "New York, NY", "1000+",
                "https://globex.example.com",
                "Globex is a global fintech company modernising payments for small businesses.");

        User initechOwner = user("talent@initech.demo", DEMO_PASSWORD, "Carla Diaz", Role.EMPLOYER);
        Company initech = company(initechOwner, "Initech Health", "Healthcare", "Austin, TX", "51-200",
                "https://initech.example.com",
                "Initech Health builds patient-facing apps that make care easier to access.");

        List<Job> jobs = new ArrayList<>();
        jobs.add(job(acme, "Senior Java Backend Engineer", "San Francisco, CA", false, JobType.FULL_TIME,
                ExperienceLevel.SENIOR, 150000, 190000, List.of("Java", "Spring Boot", "PostgreSQL", "AWS"),
                "Design and build scalable REST services powering our platform. You will own services end to end, "
                        + "mentor engineers and drive technical decisions."));
        jobs.add(job(acme, "Frontend Engineer (React)", "Remote", true, JobType.FULL_TIME, ExperienceLevel.MID,
                110000, 140000, List.of("React", "JavaScript", "TypeScript", "CSS"),
                "Build delightful, accessible user interfaces for our developer console."));
        jobs.add(job(acme, "DevOps Intern", "San Francisco, CA", false, JobType.INTERNSHIP, ExperienceLevel.ENTRY,
                40000, 50000, List.of("Linux", "Docker", "Kubernetes"),
                "Help us automate CI/CD pipelines and improve our cloud infrastructure."));
        jobs.add(job(globex, "Data Analyst", "New York, NY", false, JobType.FULL_TIME, ExperienceLevel.MID,
                90000, 115000, List.of("SQL", "Python", "Tableau"),
                "Turn payment data into insights that shape product strategy."));
        jobs.add(job(globex, "Full Stack Developer", "Remote", true, JobType.CONTRACT, ExperienceLevel.SENIOR,
                120000, 160000, List.of("Java", "React", "Spring Boot", "Docker"),
                "Six-month contract to ship a new merchant onboarding experience."));
        jobs.add(job(globex, "Customer Support Specialist", "New York, NY", false, JobType.PART_TIME,
                ExperienceLevel.ENTRY, 35000, 45000, List.of("Communication", "Zendesk"),
                "Help small business customers get the most out of Globex."));
        jobs.add(job(initech, "Mobile Developer (React Native)", "Austin, TX", false, JobType.FULL_TIME,
                ExperienceLevel.MID, 105000, 135000, List.of("React Native", "JavaScript", "iOS", "Android"),
                "Build our patient app used by over a million people."));
        jobs.add(job(initech, "Engineering Manager", "Austin, TX", true, JobType.FULL_TIME, ExperienceLevel.LEAD,
                170000, 210000, List.of("Leadership", "Java", "Agile"),
                "Lead a team of 8 engineers building clinical scheduling software."));
        jobs.add(job(initech, "QA Automation Engineer", "Remote", true, JobType.TEMPORARY, ExperienceLevel.MID,
                null, null, List.of("Selenium", "Java", "Cypress"),
                "Build an automated regression suite for our web and mobile products."));
        jobRepository.saveAll(jobs);

        User seeker = user("seeker@demo.com", DEMO_PASSWORD, "Sam Taylor", Role.JOB_SEEKER);
        SeekerProfile profile = new SeekerProfile(seeker);
        profile.setHeadline("Full Stack Developer");
        profile.setLocation("Remote");
        profile.setPhone("+1 555 0100");
        profile.setSkills("Java, Spring Boot, React, PostgreSQL");
        profile.setExperienceYears(4);
        profile.setSummary("Developer with 4 years of experience building web applications.");
        profile.setEducation("B.Sc. Computer Science");
        StoredFile resume = fileStorageService.storeResumeBytes(
                simplePdf("Sam Taylor - Resume", "Full Stack Developer | Java, Spring Boot, React"),
                "Sam_Taylor_Resume.pdf");
        profile.setResumePath(resume.path());
        profile.setResumeOriginalName(resume.originalName());
        profile.setResumeContentType(resume.contentType());
        profile.setResumeUploadedAt(Instant.now());
        profileRepository.save(profile);

        JobApplication app = new JobApplication();
        app.setJob(jobs.get(0));
        app.setApplicant(seeker);
        app.setCoverLetter("I'd love to bring my Spring Boot experience to Acme.");
        app.setResumePath(fileStorageService.copyForApplication(resume.path()));
        app.setResumeOriginalName(resume.originalName());
        app.setResumeContentType(resume.contentType());
        app.setStatus(ApplicationStatus.REVIEWING);
        applicationRepository.save(app);
    }

    private User user(String email, String password, String name, Role role) {
        User u = new User();
        u.setEmail(email.toLowerCase());
        u.setPassword(passwordEncoder.encode(password));
        u.setFullName(name);
        u.setRole(role);
        return userRepository.save(u);
    }

    private Company company(User owner, String name, String industry, String location, String size, String website,
                            String description) {
        Company c = new Company();
        c.setOwner(owner);
        c.setName(name);
        c.setIndustry(industry);
        c.setLocation(location);
        c.setCompanySize(size);
        c.setWebsite(website);
        c.setDescription(description);
        return companyRepository.save(c);
    }

    private static Job job(Company company, String title, String location, boolean remote, JobType type,
                           ExperienceLevel level, Integer min, Integer max, List<String> skills, String summary) {
        Job j = new Job();
        j.setCompany(company);
        j.setTitle(title);
        j.setLocation(location);
        j.setRemote(remote);
        j.setJobType(type);
        j.setExperienceLevel(level);
        j.setSalaryMin(min);
        j.setSalaryMax(max);
        j.getSkills().addAll(skills);
        j.setDescription(summary + "\n\nWhat you'll do:\n- Collaborate with a cross-functional team\n"
                + "- Ship high-quality work iteratively\n- Contribute to our engineering culture\n\n"
                + "What we offer:\n- Competitive salary and equity\n- Health, dental and vision coverage\n"
                + "- Flexible working hours");
        return j;
    }

    /** Builds a minimal one-page PDF so the demo applicant has a downloadable resume. */
    private static byte[] simplePdf(String title, String line) {
        String content = "BT /F1 20 Tf 72 720 Td (" + title + ") Tj ET\nBT /F1 12 Tf 72 690 Td (" + line + ") Tj ET";
        String[] objects = {
                "<< /Type /Catalog /Pages 2 0 R >>",
                "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
                "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R "
                        + "/Resources << /Font << /F1 5 0 R >> >> >>",
                "<< /Length " + content.length() + " >>\nstream\n" + content + "\nendstream",
                "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>"
        };
        StringBuilder pdf = new StringBuilder("%PDF-1.4\n");
        int[] offsets = new int[objects.length];
        for (int i = 0; i < objects.length; i++) {
            offsets[i] = pdf.length();
            pdf.append(i + 1).append(" 0 obj\n").append(objects[i]).append("\nendobj\n");
        }
        int xref = pdf.length();
        pdf.append("xref\n0 ").append(objects.length + 1).append("\n0000000000 65535 f \n");
        for (int offset : offsets) {
            pdf.append(String.format("%010d 00000 n \n", offset));
        }
        pdf.append("trailer\n<< /Size ").append(objects.length + 1).append(" /Root 1 0 R >>\nstartxref\n")
                .append(xref).append("\n%%EOF\n");
        return pdf.toString().getBytes(StandardCharsets.US_ASCII);
    }
}
