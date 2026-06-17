<?php

namespace Database\Seeders;

use App\Models\Facility;
use App\Models\Patient;
use App\Models\Referral;
use App\Models\ReferralClinicalData;
use App\Models\ReferralFeedback;
use App\Models\ReferralStatusLog;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        // --- Facilities ---
        $kakumiro = Facility::create([
            'name'     => 'Kakumiro Health Centre III',
            'code'     => 'KHC-III',
            'level'    => 'HC_III',
            'district' => 'Kakumiro',
            'region'   => 'Western',
            'phone'    => '+256-000-001',
            'email'    => 'kakumiro.hc@health.go.ug',
        ]);

        $nsambya = Facility::create([
            'name'     => 'St. Francis Hospital Nsambya',
            'code'     => 'SFN-HOSP',
            'level'    => 'Regional_Referral',
            'district' => 'Kampala',
            'region'   => 'Central',
            'phone'    => '+256-041-268-0444',
            'email'    => 'info@nsambyahospital.org',
        ]);

        $mulago = Facility::create([
            'name'     => 'Mulago National Referral Hospital',
            'code'     => 'MNRH',
            'level'    => 'National_Referral',
            'district' => 'Kampala',
            'region'   => 'Central',
            'phone'    => '+256-041-531-091',
            'email'    => 'info@mulago.go.ug',
        ]);

        // --- Users ---
        $admin = User::create([
            'name'        => 'System Admin',
            'email'       => 'admin@drcp.ug',
            'password'    => Hash::make('password'),
            'role'        => 'admin',
            'facility_id' => null,
            'phone'       => '+256-700-000-001',
            'active'      => true,
        ]);

        $doctor1 = User::create([
            'name'        => 'Dr. Levi Kembe',
            'email'       => 'doctor@kakumiro.ug',
            'password'    => Hash::make('password'),
            'role'        => 'doctor',
            'facility_id' => $kakumiro->id,
            'phone'       => '+256-776-488-456',
            'active'      => true,
        ]);

        $nurse1 = User::create([
            'name'        => 'Nurse Buyinza',
            'email'       => 'nurse@kakumiro.ug',
            'password'    => Hash::make('password'),
            'role'        => 'nurse',
            'facility_id' => $kakumiro->id,
            'phone'       => '+256-756-884-597',
            'active'      => true,
        ]);

        $doctor2 = User::create([
            'name'        => 'Dr. Aaron Kafeero',
            'email'       => 'doctor@nsambya.ug',
            'password'    => Hash::make('password'),
            'role'        => 'doctor',
            'facility_id' => $nsambya->id,
            'phone'       => '+256-760-791-098',
            'active'      => true,
        ]);

        $referralOfficer = User::create([
            'name'        => 'Naboth Twinomujuni',
            'email'       => 'referral@nsambya.ug',
            'password'    => Hash::make('password'),
            'role'        => 'referral_officer',
            'facility_id' => $nsambya->id,
            'phone'       => '+256-772-582-630',
            'active'      => true,
        ]);

        $records = User::create([
            'name'        => 'Alex Kato',
            'email'       => 'records@kakumiro.ug',
            'password'    => Hash::make('password'),
            'role'        => 'records_officer',
            'facility_id' => $kakumiro->id,
            'phone'       => '+256-744-277-132',
            'active'      => true,
        ]);

        // --- Patients ---
        $patients = [];
        $samplePatients = [
            ['full_name' => 'Amina Nakato',      'sex' => 'female', 'date_of_birth' => '1990-03-15', 'district' => 'Kakumiro'],
            ['full_name' => 'John Mugisha',       'sex' => 'male',   'date_of_birth' => '1975-07-22', 'district' => 'Kiboga'],
            ['full_name' => 'Grace Atuhaire',     'sex' => 'female', 'date_of_birth' => '2001-11-05', 'district' => 'Kakumiro'],
            ['full_name' => 'Robert Ssekandi',    'sex' => 'male',   'date_of_birth' => '1988-01-30', 'district' => 'Kampala'],
            ['full_name' => 'Prossy Nalwoga',     'sex' => 'female', 'date_of_birth' => '1995-09-14', 'district' => 'Masaka'],
        ];

        foreach ($samplePatients as $p) {
            $patients[] = Patient::create(array_merge($p, [
                'registered_by' => $doctor1->id,
                'facility_id'   => $kakumiro->id,
                'phone'         => '+256-7' . rand(10, 99) . '-' . rand(100, 999) . '-' . rand(100, 999),
            ]));
        }

        // --- Referrals ---
        $statuses = ['submitted', 'acknowledged', 'in_transit', 'received', 'completed'];
        $urgencies = ['emergency', 'urgent', 'routine'];

        foreach ($patients as $i => $patient) {
            $urgency = $urgencies[$i % 3];
            $status  = $statuses[$i % 5];

            $referral = Referral::create([
                'referral_number'       => 'REF-' . strtoupper(Str::random(8)),
                'patient_id'            => $patient->id,
                'referring_facility_id' => $kakumiro->id,
                'receiving_facility_id' => $nsambya->id,
                'referred_by'           => $doctor1->id,
                'urgency'               => $urgency,
                'status'                => $status,
                'reason_for_referral'   => 'Patient requires specialist care beyond HC III capacity.',
                'additional_notes'      => 'Please prioritize assessment on arrival.',
            ]);

            ReferralClinicalData::create([
                'referral_id'           => $referral->id,
                'presenting_complaint'  => 'Fever and severe headache for 3 days',
                'clinical_history'      => 'No known chronic illness.',
                'examination_findings'  => 'Temperature 39.5°C, BP 130/85, HR 98',
                'diagnosis'             => 'Suspected malaria with complications',
                'treatment_given'       => 'IV Artesunate 120mg, IV fluids',
                'allergies'             => 'Penicillin',
                'investigations_summary'=> 'RDT Positive, Hb 9.2g/dl',
                'current_medications'   => 'None',
            ]);

            ReferralStatusLog::create([
                'referral_id' => $referral->id,
                'status'      => 'submitted',
                'changed_by'  => $doctor1->id,
                'notes'       => 'Referral created.',
            ]);

            if (in_array($status, ['acknowledged', 'in_transit', 'received', 'completed'])) {
                ReferralStatusLog::create([
                    'referral_id' => $referral->id,
                    'status'      => 'acknowledged',
                    'changed_by'  => $referralOfficer->id,
                    'notes'       => 'Received and acknowledged by Nsambya.',
                ]);
                $referral->update(['acknowledged_by' => $referralOfficer->id, 'acknowledged_at' => now()]);
            }

            if ($status === 'completed') {
                ReferralStatusLog::create([
                    'referral_id' => $referral->id,
                    'status'      => 'completed',
                    'changed_by'  => $doctor2->id,
                    'notes'       => 'Patient treated and discharged.',
                ]);
                ReferralFeedback::create([
                    'referral_id'       => $referral->id,
                    'submitted_by'      => $doctor2->id,
                    'outcome'           => 'treated_discharged',
                    'treatment_summary' => 'Patient responded to IV treatment. Discharged after 3 days.',
                    'notes'             => 'Follow-up in 2 weeks at HC III.',
                ]);
            }
        }

        $this->command->info('✅ DRCP seeded: 3 facilities, 6 users, 5 patients, 5 referrals');
        $this->command->info('   Login: admin@drcp.ug / password');
        $this->command->info('   Login: doctor@kakumiro.ug / password');
        $this->command->info('   Login: doctor@nsambya.ug / password');
    }
}
