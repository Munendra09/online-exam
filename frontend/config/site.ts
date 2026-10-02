/**
 * Site Configuration
 * All branding, content, and settings in one place.
 */
export const siteConfig = {
  /* ---- Branding ---- */
  name: 'Lucky Tech Academy',
  fullName: 'Lucky Tech Academy Exam Portal',
  shortName: 'LTA Exam Portal',
  logoText: 'LTA',

  /* ---- Contact ---- */
  email: 'luckytechacademy@gmail.com',
  phone: '+91 86304 78726',
  location: 'Kasganj, Uttar Pradesh',
  website: 'https://luckytechacademy.in',

  /* ---- Content ---- */
  tagline: 'A leading IT training institute in Kasganj offering practical computer courses with live projects, placement support, and industry-focused training.',
  heroTitle: 'Smart Exam Portal for Lucky Tech Academy',
  heroSubtitle: 'Secure online examination system with class-wise paper assignment, timed exams, admit cards, answer keys, and automated result processing.',
  description: 'Lucky Tech Academy provides practical classroom training, project-based learning, interview preparation, and expert mentorship to help students build successful careers in technology.',

  /* ---- Default Exam ---- */
  defaultExamTitle: 'Lucky Tech Academy Scholarship Exam',

  /* ---- Features List ---- */
  features: [
    { title: 'Class-wise Paper Assignment', description: 'Questions auto-assigned based on student class for targeted exam preparation' },
    { title: 'CSV Question Upload', description: 'Upload question banks via CSV for each exam — simple and quick' },
    { title: 'Timed Shift-based Exams', description: 'Set exam date, start time, shift, and duration with auto-submit on expiry' },
    { title: 'Admit Card & Roll Number', description: 'Generate and release admit cards with unique roll numbers for each student' },
    { title: 'Answer Key & Results', description: 'Release answer keys and results with admin control over timing' },
    { title: 'Exam Lockdown Mode', description: 'Full-screen exam with tab-switch detection and security monitoring' },
  ],

  /* ---- Stats ---- */
  stats: [
    { label: 'Students Trained', value: '100+' },
    { label: 'Hiring Partners', value: '40+' },
    { label: 'Courses Available', value: '30+' },
    { label: 'Years Experience', value: '3+' },
  ],

  /* ---- Footer ---- */
  footerText: 'Lucky Tech Academy is a skill-focused IT training institute in Kasganj helping students, freshers, and professionals build careers in technology.',
  mission: 'To deliver practical, job-oriented technology training that is accessible, industry-relevant, and focused on real career growth for every learner.',

  /* ---- Default Exam Center ---- */
  defaultCenter: 'Lucky Tech Academy, Kasganj',

  /* ---- Exam Center Geo-Fencing ---- */
  examCenter: {
    latitude: 27.8073,
    longitude: 78.6467,
    allowedRadiusMeters: 500,
    geoCheckEnabled: true,
  },
};