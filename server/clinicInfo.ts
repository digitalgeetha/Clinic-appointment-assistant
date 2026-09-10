/**
 * Approved Clinic Knowledge Base & Rules for Harbor Dental Care
 * All assistant responses must strictly adhere to these facts.
 */

export const CLINIC_INFO = {
  name: "Harbor Dental Care",
  location: "123 Marina Medical Centre, Dubai, UAE",
  hours: {
    weekday: "Monday to Friday: 8:00 AM to 7:00 PM",
    saturday: "Saturday: 9:00 AM to 2:00 PM",
    sunday: "Sunday: Closed",
    mondayOpen: "8:00 AM",
    saturdayClose: "2:00 PM",
  },
  receptionDuties:
    "Reception handles appointment booking, rescheduling, cancellations, and administrative questions.",
  whatToBring: [
    "A valid ID",
    "Any appointment confirmation information you have",
  ],
  routinePreparation:
    "For a routine dental consultation, no fasting is required unless the clinic has specifically instructed the patient otherwise.",
  procedurePreparationRule:
    "Preparation requirements can vary by procedure. We do not have procedure-specific preparation instructions in our approved records. Please confirm exact instructions with your clinician or reception.",
  phoneNumberMessage:
    "I don't have the clinic's phone number in the information available to me. Please use the practice's official contact details or contact reception during opening hours.",
  unknownInfoMessage:
    "I don't have that information in the clinic information available to me. Please contact reception for confirmation.",
  disclaimer:
    "Administrative information only. This assistant does not provide medical advice.",
};

export const CLINICAL_SAFETY_RULES = {
  emergencyTriggers: [
    "difficulty breathing",
    "trouble breathing",
    "hard to breathe",
    "cannot breathe",
    "can't breathe",
    "swelling affecting breathing",
    "throat swelling",
    "facial swelling affecting breathing",
    "uncontrolled severe bleeding",
    "uncontrolled bleeding",
    "heavy bleeding that won't stop",
    "loss of consciousness",
    "unconscious",
    "passed out",
    "fainted and unresponsive",
    "severe allergic reaction",
    "anaphylaxis",
  ],
  symptomTriggers: [
    "tooth pain",
    "toothache",
    "severe toothache",
    "pain in my tooth",
    "teeth hurt",
    "hurts badly",
    "swelling",
    "swollen",
    "facial swelling",
    "bleeding",
    "gums bleeding",
    "fever",
    "infection",
    "jaw pain",
    "numbness",
    "sensitivity",
    "broken tooth",
    "knocked-out tooth",
    "knocked out tooth",
    "pus",
    "abscess",
    "medication reaction",
    "allergic reaction",
    "what medicine",
    "what medication",
    "what painkiller",
    "should i take paracetamol",
    "should i take ibuprofen",
    "should i take antibiotics",
    "how much paracetamol",
    "how much ibuprofen",
    "prescribe",
    "diagnose",
    "is this normal",
  ],
};

export function checkSafetyBoundary(userText: string): {
  isEmergency: boolean;
  isClinical: boolean;
  response?: string;
} {
  const text = userText.toLowerCase();

  // Check emergency triggers first
  for (const trigger of CLINICAL_SAFETY_RULES.emergencyTriggers) {
    if (text.includes(trigger)) {
      return {
        isEmergency: true,
        isClinical: true,
        response:
          "🚨 URGENT MEDICAL ADVISORY: The symptoms you described (such as difficulty breathing, severe facial swelling affecting your airway, uncontrolled bleeding, or loss of consciousness) indicate a potential medical emergency.\n\nPlease seek urgent medical care immediately and contact local emergency services (such as 999 in the UAE or your local emergency number) without delay. Harbor Dental Care's administrative assistant cannot diagnose or treat medical emergencies.",
      };
    }
  }

  // Check symptom / clinical advice triggers
  for (const trigger of CLINICAL_SAFETY_RULES.symptomTriggers) {
    if (text.includes(trigger)) {
      return {
        isEmergency: false,
        isClinical: true,
        response:
          "I cannot provide medical advice, evaluate symptoms, diagnose conditions, or recommend medications (including pain relief or antibiotics). Please consult a qualified dental clinician for clinical advice. If you would like, I can help you check appointment availability or book a consultation with one of our dentists.",
      };
    }
  }

  return { isEmergency: false, isClinical: false };
}
