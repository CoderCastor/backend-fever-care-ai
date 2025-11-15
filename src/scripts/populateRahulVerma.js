const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();

const {
  User, PatientProfile, ClinicianProfile, FeverEpisode, SymptomLog,
  EpisodeHistory, Temperature, Alert, Medication, MedicationLog, MLPrediction,
  FamilyHistory, ContactTracing, OccupationalInfo, DiseaseHotspot, MedicationHistory
} = require('../models');

const connectDB = require('../config/database');

async function populateRahulVermaCase() {
  try {
    await connectDB();
    console.log('\n🏥 POPULATING RAHUL VERMA CASE STUDY');
    console.log('='*70 + '\n');

    const hashedPassword = await bcrypt.hash('password@123', 10);

    // ========================================
    // DAY 1 - NOV 11, 2025
    // ========================================
    console.log('📅 DAY 1 (Nov 11, 2025) - Initial Symptoms\n' + '-'.repeat(70));

    // 1. CREATE RAHUL VERMA (PATIENT)
    const rahul = await User.create({
      name: 'Rahul Verma',
      email: 'rahul.verma@techcorp.com',
      password: hashedPassword,
      role: 'patient',
      phone: '+919876543220',
      isActive: true,
      isVerified: true
    });
    console.log(`✅ Patient: ${rahul.name} (ID: ${rahul._id})`);

    // 2. PATIENT PROFILE
    await PatientProfile.create({
      userId: rahul._id,
      age: 28,
      gender: 'male',
      dateOfBirth: new Date('1997-03-15'),
      bloodGroup: 'B+',
      emergencyContact: {
        name: 'Priya Verma (Wife)',
        phone: '+919876543221',
        relationship: 'spouse'
      },
      location: {
        type: 'Point',
        coordinates: [73.8567, 18.5204],
        address: 'Flat 302, Skyline Apartments, Baner',
        city: 'Pune',
        state: 'Maharashtra',
        country: 'India'
      },
      allergies: ['Aspirin'],
      chronicConditions: [],
      status: 'active'
    });
    console.log('✅ Profile created');

    // 3. FAMILY HISTORY (HEMOPHILIA - CRITICAL!)
    await FamilyHistory.create({
      patientId: rahul._id,
      hemophilia: true,
      hemophiliaRelation: 'father',
      dengueHistory: false,
      dengueCount: 0,
      diabetes: false,
      hypertension: false,
      notes: 'Father has mild hemophilia. CRITICAL: AVOID ASPIRIN/NSAIDs - HIGH BLEEDING RISK!'
    });
    console.log('🚨 Family History: Father has HEMOPHILIA (bleeding disorder)');

    // 4. OCCUPATIONAL INFO
    await OccupationalInfo.create({
      patientId: rahul._id,
      occupation: 'Software Engineer',
      employer: 'TechCorp India Pvt Ltd',
      workLocation: {
        address: 'Hinjewadi Phase 1',
        city: 'Pune',
        coordinates: [73.7279, 18.5912]
      },
      workType: 'indoor',
      outdoorExposure: false,
      hasACOffice: true,
      nearWaterBody: false,
      constructionNearby: true,
      sickColleagues: [],
      workplaceOutbreak: false
    });
    console.log('✅ Occupation: Software Engineer, Hinjewadi');

    // 5. MEDICATION HISTORY (ASPIRIN ALLERGY!)
    await MedicationHistory.create({
      patientId: rahul._id,
      medicationName: 'Aspirin',
      category: 'painkiller',
      prescribedDate: new Date('2023-05-10'),
      indication: 'Headache',
      hadReaction: true,
      reactionType: 'severe rash, itching, stomach pain',
      reactionSeverity: 'moderate',
      wasEffective: false,
      sideEffects: ['rash', 'itching', 'stomach upset'],
      notes: '⛔ ALLERGIC REACTION! Never prescribe Aspirin or NSAIDs!'
    });
    console.log('🚨 Medication Alert: ALLERGIC to Aspirin!');

    // 6. CREATE DOCTOR
    const drMehra = await User.findOne({ email: 'dr.mehra@clinic.com' });
    let doctor;
    
    if (!drMehra) {
      doctor = await User.create({
        name: 'Dr. Amit Mehra',
        email: 'dr.mehra@clinic.com',
        password: hashedPassword,
        role: 'clinician',
        phone: '+919876500001',
        isVerified: true
      });

      await ClinicianProfile.create({
        userId: doctor._id,
        specialization: 'general_medicine',
        licenseNumber: 'MH-2015-12345',
        hospitalName: 'Mehra Clinic',
        hospitalAddress: 'Baner, Pune',
        yearsOfExperience: 10,
        isVerified: true
      });
      console.log(`✅ Doctor: ${doctor.name}`);
    } else {
      doctor = drMehra;
      console.log(`✅ Using existing doctor: ${doctor.name}`);
    }

    // 7. FEVER EPISODE STARTS
    const day1Date = new Date('2025-11-11T08:00:00');
    
    const episode = await FeverEpisode.create({
      patientId: rahul._id,
      startedAt: day1Date,
      status: 'active',
      assignedClinician: doctor._id,
      hospitalized: false
    });
    console.log(`✅ Episode: ${episode._id}`);

    // 8. EPISODE HISTORY
    await EpisodeHistory.create({
      episodeId: episode._id,
      priorAntibiotics: false,
      hasDiabetes: false,
      immunocompromised: false,
      recentTravel: false,
      mosquitoExposure: true,
      sickContacts: false,
      waterSource: 'filtered',
      feverPattern: 'continuous',
      highestTemperature: 102.0,
      measurementMethod: 'digital'
    });

    // 9. DAY 1 SYMPTOMS
    const day1Symptoms = await SymptomLog.create({
      episodeId: episode._id,
      patientId: rahul._id,
      logDate: day1Date,
      dayOfIllness: 1,
      temperature: 102.0,
      tempTime: 'morning',
      pulseRate: 88,
      headache: true,
      bodyPain: false,
      rash: false,
      bleeding: false,
      abdominalPain: false,
      vomiting: false,
      foodIntake: 'normal',
      urineOutput: 'normal',
      paracetamolTaken: true,
      paracetamolResponse: 'partial_relief',
      notes: 'Mild headache, feeling tired'
    });

    await Temperature.create([
      { patientId: rahul._id, temperature: 102.0, recordedAt: new Date('2025-11-11T08:00:00') },
      { patientId: rahul._id, temperature: 101.8, recordedAt: new Date('2025-11-11T14:00:00') },
      { patientId: rahul._id, temperature: 102.2, recordedAt: new Date('2025-11-11T20:00:00') }
    ]);

    // 10. DAY 1 AI PREDICTION
    await MLPrediction.create({
      symptomLogId: day1Symptoms._id,
      episodeId: episode._id,
      dengueProbability: 25.0,
      typhoidProbability: 15.0,
      malariaProbability: 10.0,
      viralProbability: 45.0,
      covidProbability: 5.0,
      primaryDiagnosis: 'viral',
      confidenceScore: 45.0,
      urgency: 'LOW',
      fefconRecommendation: 'Monitor symptoms. Hydration. Paracetamol for fever. Avoid NSAIDs.',
      investigationsNeeded: ['CBC if fever persists >3 days'],
      keyFeatures: ['Monsoon season', 'Mosquito exposure'],
      modelVersion: 'v1.0'
    });

    await Alert.create({
      patientId: rahul._id,
      alertType: 'checkup_due',
      severity: 'low',
      message: '⚠️ Monsoon season + Mosquito exposure. Monitor for dengue symptoms (body pain, eye pain, rash). Consider NS1 test if symptoms worsen.',
      isRead: false,
      actionRequired: true,
      metadata: { dayOfIllness: 1, dengueProbability: 25.0 }
    });

    console.log('🤖 AI: "Monitor for dengue - 25% probability"');
    console.log('✅ DAY 1 DONE - Doctor: "Just viral, take rest"\n');

    // ========================================
    // DAY 3 - NOV 13, 2025
    // ========================================
    console.log('📅 DAY 3 (Nov 13, 2025) - Symptoms Worsening\n' + '-'.repeat(70));

    const day3Date = new Date('2025-11-13T08:00:00');

    const day3Symptoms = await SymptomLog.create({
      episodeId: episode._id,
      patientId: rahul._id,
      logDate: day3Date,
      dayOfIllness: 3,
      temperature: 103.5,
      tempTime: 'morning',
      pulseRate: 92,
      headache: true,
      bodyPain: true,
      rash: false,
      bleeding: false,
      abdominalPain: false,
      vomiting: false,
      foodIntake: 'reduced',
      urineOutput: 'normal',
      paracetamolTaken: true,
      paracetamolResponse: 'reduced_fever',
      notes: 'Severe body pain, headache worse'
    });

    await Temperature.create([
      { patientId: rahul._id, temperature: 103.5, recordedAt: new Date('2025-11-13T08:00:00') },
      { patientId: rahul._id, temperature: 103.8, recordedAt: new Date('2025-11-13T14:00:00') },
      { patientId: rahul._id, temperature: 103.2, recordedAt: new Date('2025-11-13T20:00:00') }
    ]);

    await MLPrediction.create({
      symptomLogId: day3Symptoms._id,
      episodeId: episode._id,
      dengueProbability: 58.0,
      typhoidProbability: 20.0,
      malariaProbability: 12.0,
      viralProbability: 8.0,
      covidProbability: 2.0,
      primaryDiagnosis: 'dengue',
      confidenceScore: 58.0,
      urgency: 'MEDIUM',
      fefconRecommendation: 'PROBABLE DENGUE! Order NS1 + CBC immediately. Monitor platelets. Entering critical phase.',
      investigationsNeeded: ['NS1 Antigen', 'CBC', 'Platelet Count'],
      keyFeatures: ['Dengue triad', 'Day 3', 'Monsoon'],
      modelVersion: 'v1.0'
    });

    await Alert.create({
      patientId: rahul._id,
      alertType: 'lab_result',
      severity: 'medium',
      message: '🚨 DENGUE: 58% probability!\n\nDengue triad: Fever + Headache + Body pain\n\nURGENT:\n✓ NS1 test\n✓ CBC + Platelet\n✓ Watch for bleeding/vomiting',
      isRead: false,
      actionRequired: true,
      metadata: { dayOfIllness: 3, dengueProbability: 58.0 }
    });

    episode.finalDiagnosis = 'dengue';
    episode.labConfirmed = true;
    episode.confirmationDate = day3Date;
    await episode.save();

    console.log('🚨 AI: "DENGUE 58%! Order NS1!"');
    console.log('✅ NS1 Result: POSITIVE');
    console.log('✅ DAY 3 DONE - Dengue confirmed!\n');

    // ========================================
    // DAY 4 - NOV 14, 2025 - CRITICAL!
    // ========================================
    console.log('📅 DAY 4 (Nov 14, 2025) - CRITICAL PHASE!\n' + '-'.repeat(70));

    const day4Date = new Date('2025-11-14T08:00:00');

    const day4Symptoms = await SymptomLog.create({
      episodeId: episode._id,
      patientId: rahul._id,
      logDate: day4Date,
      dayOfIllness: 4,
      temperature: 104.2,
      tempTime: 'morning',
      pulseRate: 98,
      headache: true,
      bodyPain: true,
      rash: true,
      bleeding: false,
      abdominalPain: false,
      vomiting: true,
      vomitingCount: 2,
      foodIntake: 'poor',
      urineOutput: 'normal',
      paracetamolTaken: true,
      paracetamolResponse: 'no_effect',
      notes: 'HIGH FEVER! Rash, vomiting. Very weak.'
    });

    await Temperature.create([
      { patientId: rahul._id, temperature: 104.2, recordedAt: new Date('2025-11-14T08:00:00') },
      { patientId: rahul._id, temperature: 104.5, recordedAt: new Date('2025-11-14T14:00:00') }
    ]);

    await MLPrediction.create({
      symptomLogId: day4Symptoms._id,
      episodeId: episode._id,
      dengueProbability: 75.0,
      typhoidProbability: 12.0,
      malariaProbability: 8.0,
      viralProbability: 3.0,
      covidProbability: 2.0,
      primaryDiagnosis: 'dengue',
      confidenceScore: 75.0,
      urgency: 'HIGH',
      fefconRecommendation: '🚨 DAY 4 CRITICAL PHASE! CBC q6h. Admit if platelet <100k. Watch vomiting/bleeding!',
      investigationsNeeded: ['CBC q6h', 'Hematocrit', 'Platelet'],
      keyFeatures: ['Day 4 critical', 'Rash', 'Vomiting'],
      modelVersion: 'v1.0'
    });

    // LIFE-SAVING AI ALERT!
    await Alert.create({
      patientId: rahul._id,
      alertType: 'danger_sign',
      severity: 'critical',
      message: '🚨🚨 CRITICAL - ASPIRIN CONTRAINDICATED! 🚨🚨\n\n⛔ STOP! DO NOT PRESCRIBE:\n- Aspirin\n- Ibuprofen\n- Any NSAIDs\n\nREASONS:\n1. ⚠️ ASPIRIN ALLERGY (medication history)\n2. ⚠️ FAMILY HEMOPHILIA (father)\n3. ⚠️ DENGUE DAY 4 (bleeding risk)\n4. ⚠️ Platelet drop expected\n\n✅ SAFE: Paracetamol only!\n\n🏥 ADMIT FOR MONITORING',
      isRead: false,
      actionRequired: true,
      metadata: {
        dayOfIllness: 4,
        criticalPhase: true,
        contraindication: ['Aspirin', 'NSAIDs'],
        familyHistory: 'hemophilia',
        allergyAlert: true,
        lifeSaving: true
      }
    });

    console.log('🚨🚨 AI LIFE-SAVING INTERVENTION:');
    console.log('   ⛔ STOPPED ASPIRIN PRESCRIPTION!');
    console.log('   Reasons:');
    console.log('   - Patient allergic to Aspirin');
    console.log('   - Family history: Father has hemophilia');
    console.log('   - Dengue Day 4 = HIGH bleeding risk');
    console.log('   - Could have caused hemorrhagic dengue!\n');

    // CONTACT TRACING
    console.log('📞 Contact Tracing - Office Colleagues:');
    
    const colleagues = [
      { name: 'Ankit Patel', phone: '+919876543222', email: 'ankit@techcorp.com' },
      { name: 'Sneha Desai', phone: '+919876543223', email: 'sneha@techcorp.com' },
      { name: 'Karan Singh', phone: '+919876543224', email: 'karan@techcorp.com' }
    ];

    for (const colleague of colleagues) {
      await ContactTracing.create({
        patientId: rahul._id,
        episodeId: episode._id,
        contactPersonName: colleague.name,
        contactPhone: colleague.phone,
        contactEmail: colleague.email,
        relationship: 'colleague',
        lastContactDate: new Date('2025-11-13'),
        contactDuration: 8,
        contactLocation: 'Office - Hinjewadi',
        hasSymptoms: false,
        tested: false,
        notified: true,
        notifiedAt: new Date(),
        riskLevel: 'high'
      });
      console.log(`   ✓ ${colleague.name}`);
    }

    // HOTSPOT
    await DiseaseHotspot.create({
      location: {
        type: 'Point',
        coordinates: [73.8567, 18.5204]
      },
      city: 'Pune',
      state: 'Maharashtra',
      pincode: '411045',
      area: 'Baner',
      disease: 'dengue',
      caseCount: 1,
      activeCases: 1,
      severity: 'medium',
      weekNumber: 46,
      month: 11,
      year: 2025,
      medicineRequired: 'Paracetamol, IV Fluids, ORS',
      quantityNeeded: 100,
      distributionStatus: 'pending'
    });
    console.log('🗺️  Hotspot: Baner, Pune (for Micro Labs)\n');

    console.log('✅ DAY 4 DONE - Patient admitted to ICU');
    console.log('   Life saved by AI intervention!\n');

    // SUMMARY
    console.log('='.repeat(70));
    console.log('🎉 RAHUL VERMA CASE - COMPLETE!\n');
    console.log('📊 IDs:');
    console.log(`   Patient: ${rahul._id}`);
    console.log(`   Episode: ${episode._id}`);
    console.log(`   Doctor: ${doctor.name}`);
    console.log('\n🤖 AI INTERVENTIONS:');
    console.log('   ✓ Day 1: Flagged dengue risk (mosquito area)');
    console.log('   ✓ Day 3: Recommended NS1 (58% dengue)');
    console.log('   ✓ Day 4: PREVENTED ASPIRIN (LIFE-SAVING!)');
    console.log('   ✓ Contact tracing: 3 colleagues notified');
    console.log('   ✓ Hotspot mapped for Micro Labs');
    console.log('\n💊 SAFETY CHECKS:');
    console.log('   ⛔ Aspirin - BLOCKED (allergy + bleeding risk)');
    console.log('   ✅ Paracetamol - Safe alternative');
    console.log('\n📍 CONTACT TRACING:');
    colleagues.forEach(c => console.log(`   - ${c.name}`));
    console.log('\n🗺️  MICRO LABS HOTSPOT:');
    console.log('   Location: Baner, Pune');
    console.log('   Medicine needed: 100 units');
    console.log('   Status: Pending dispatch');
    console.log('\n' + '='.repeat(70));

    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

populateRahulVermaCase();
