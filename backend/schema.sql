-- =============================================
-- TobyCare - Base de données
-- =============================================

CREATE DATABASE IF NOT EXISTS clinique_mada CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE clinique_mada;

-- Table utilisateurs
CREATE TABLE IF NOT EXISTS utilisateurs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nom VARCHAR(100) NOT NULL,
  prenom VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  mot_de_passe VARCHAR(255) NOT NULL,
  role ENUM('admin', 'medecin', 'secretaire') NOT NULL DEFAULT 'secretaire',
  actif BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Table médecins (informations supplémentaires)
CREATE TABLE IF NOT EXISTS medecins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  utilisateur_id INT NOT NULL,
  specialite VARCHAR(150),
  telephone VARCHAR(20),
  FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id) ON DELETE CASCADE
);

-- Table patients
CREATE TABLE IF NOT EXISTS patients (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nom VARCHAR(100) NOT NULL,
  prenom VARCHAR(100) NOT NULL,
  date_naissance DATE,
  sexe ENUM('M', 'F') NOT NULL,
  telephone VARCHAR(20),
  adresse TEXT,
  email VARCHAR(150),
  num_dossier VARCHAR(50) UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Table rendez-vous
CREATE TABLE IF NOT EXISTS rendez_vous (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  medecin_id INT NOT NULL,
  date_rdv DATE NOT NULL,
  heure_rdv TIME NOT NULL,
  motif TEXT,
  statut ENUM('planifie', 'confirme', 'annule', 'termine') DEFAULT 'planifie',
  notes TEXT,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  FOREIGN KEY (medecin_id) REFERENCES utilisateurs(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES utilisateurs(id)
);

-- Table consultations
CREATE TABLE IF NOT EXISTS consultations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  medecin_id INT NOT NULL,
  rendez_vous_id INT,
  date_consultation DATE NOT NULL,
  motif TEXT NOT NULL,
  diagnostic TEXT,
  traitement TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  FOREIGN KEY (medecin_id) REFERENCES utilisateurs(id) ON DELETE CASCADE,
  FOREIGN KEY (rendez_vous_id) REFERENCES rendez_vous(id)
);

-- =============================================
-- Données initiales
-- =============================================

-- Admin par défaut : admin@clinique.mg / Admin1234!
INSERT INTO utilisateurs (nom, prenom, email, mot_de_passe, role) VALUES
('Administrateur', 'Clinique', 'admin@clinique.mg', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin');

-- Médecin exemple : dr.rakoto@clinique.mg / Medecin1234!
INSERT INTO utilisateurs (nom, prenom, email, mot_de_passe, role) VALUES
('Rakoto', 'Jean', 'dr.rakoto@clinique.mg', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'medecin');

INSERT INTO medecins (utilisateur_id, specialite, telephone) VALUES
(2, 'Médecine générale', '+261 34 00 000 01');

-- Secrétaire exemple : secretaire@clinique.mg / Secr1234!
INSERT INTO utilisateurs (nom, prenom, email, mot_de_passe, role) VALUES
('Rasoa', 'Marie', 'secretaire@clinique.mg', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'secretaire');

-- Quelques patients exemples
INSERT INTO patients (nom, prenom, date_naissance, sexe, telephone, adresse, num_dossier) VALUES
('Andriamahefa', 'Paul', '1985-03-15', 'M', '+261 34 12 345 67', 'Antananarivo, Analakely', 'PAT-0001'),
('Razafindrabe', 'Hanta', '1992-07-22', 'F', '+261 33 98 765 43', 'Antananarivo, Ampefiloha', 'PAT-0002'),
('Rabemananjara', 'Solo', '1978-11-08', 'M', '+261 32 45 678 90', 'Antananarivo, Tsaralalana', 'PAT-0003'),
('Rajaonarivelo', 'Lalaina', '2001-01-30', 'F', '+261 34 56 789 01', 'Antananarivo, Isotry', 'PAT-0004'),
('Randrianarisoa', 'Fidy', '1965-05-20', 'M', '+261 33 67 890 12', 'Antananarivo, Behoririka', 'PAT-0005');

-- Rendez-vous exemples (dates relatives)
INSERT INTO rendez_vous (patient_id, medecin_id, date_rdv, heure_rdv, motif, statut, created_by) VALUES
(1, 2, CURDATE(), '09:00:00', 'Consultation générale', 'planifie', 3),
(2, 2, CURDATE(), '10:30:00', 'Suivi traitement', 'planifie', 3),
(3, 2, CURDATE(), '14:00:00', 'Douleurs abdominales', 'confirme', 3),
(4, 2, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '08:30:00', 'Vaccination', 'planifie', 3),
(5, 2, DATE_ADD(CURDATE(), INTERVAL 2 DAY), '11:00:00', 'Bilan annuel', 'planifie', 3),
(1, 2, DATE_SUB(CURDATE(), INTERVAL 3 DAY), '09:00:00', 'Fièvre', 'termine', 3);

-- Consultations exemples
INSERT INTO consultations (patient_id, medecin_id, rendez_vous_id, date_consultation, motif, diagnostic, traitement) VALUES
(1, 2, 6, DATE_SUB(CURDATE(), INTERVAL 3 DAY), 'Fièvre depuis 2 jours', 'Infection virale légère', 'Paracétamol 500mg - 3x/jour pendant 5 jours. Repos et hydratation.'),
(2, 2, NULL, DATE_SUB(CURDATE(), INTERVAL 7 DAY), 'Toux persistante', 'Bronchite aiguë', 'Amoxicilline 500mg - 2x/jour pendant 7 jours. Sirop antitussif.'),
(3, 2, NULL, DATE_SUB(CURDATE(), INTERVAL 14 DAY), 'Douleurs lombaires', 'Lombalgie commune', 'Ibuprofène 400mg - 3x/jour. Kinésithérapie recommandée.');