# Backend Endpoint Requirements

## Attendance Status Endpoint

Untuk mendukung pengecekan status presensi dari frontend, perlu ditambahkan endpoint berikut:

### Route

```php
// Di file routes/api.php
Route::get('/attendances/status', [AttendanceController::class, 'getStatusApi']);
```

### Controller Method

```php
// Di AttendanceController.php

/**
 * Get current attendance status for authenticated user (API)
 */
public function getStatusApi(Request $request)
{
    try {
        $user = Auth::user();
        $today = Carbon::today()->toDateString();

        // Get today's attendance record
        $attendance = Attendance::where('user_id', $user->id)
            ->whereDate('created_at', $today)
            ->first();

        if ($attendance) {
            $status = 'not_checked_in';

            if ($attendance->check_out_time) {
                $status = 'checked_out';
            } elseif ($attendance->check_in_time) {
                $status = 'checked_in';
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'id' => $attendance->id,
                    'user_id' => $attendance->user_id,
                    'check_in_time' => $attendance->check_in_time,
                    'check_out_time' => $attendance->check_out_time,
                    'check_in_location' => $attendance->check_in_location,
                    'check_out_location' => $attendance->check_out_location,
                    'check_in_photo' => $attendance->check_in_photo,
                    'check_out_photo' => $attendance->check_out_photo,
                    'notes' => $attendance->notes,
                    'date' => $attendance->created_at->toDateString(),
                    'status' => $status,
                ],
            ], 200);
        } else {
            return response()->json([
                'success' => true,
                'data' => [
                    'user_id' => $user->id,
                    'date' => $today,
                    'status' => 'not_checked_in',
                ],
            ], 200);
        }
    } catch (\Exception $e) {
        Log::error('Error getting attendance status API:', ['error' => $e->getMessage()]);
        return response()->json([
            'success' => false,
            'message' => 'Terjadi kesalahan server.'
        ], 500);
    }
}
```

### Database Migration (jika diperlukan)

Pastikan tabel attendances memiliki struktur yang sesuai:

```php
Schema::create('attendances', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->constrained()->onDelete('cascade');
    $table->timestamp('check_in_time')->nullable();
    $table->timestamp('check_out_time')->nullable();
    $table->text('check_in_location')->nullable();
    $table->text('check_out_location')->nullable();
    $table->string('check_in_photo')->nullable();
    $table->string('check_out_photo')->nullable();
    $table->text('notes')->nullable();
    $table->timestamps();

    // Index untuk performa query
    $table->index(['user_id', 'created_at']);
});
```

### Model Attendance (jika diperlukan)

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Attendance extends Model
{
    protected $fillable = [
        'user_id',
        'check_in_time',
        'check_out_time',
        'check_in_location',
        'check_out_location',
        'check_in_photo',
        'check_out_photo',
        'notes',
    ];

    protected $casts = [
        'check_in_time' => 'datetime',
        'check_out_time' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
```

## Integrasi dengan Frontend

Frontend sekarang akan:

1. Mengecek status dari backend saat pertama kali load halaman home
2. Menggunakan data backend sebagai source of truth
3. Fallback ke local storage jika backend tidak tersedia
4. Menyinkronkan local storage dengan data backend

Ini memastikan konsistensi data antara device yang berbeda dan memberikan real-time status yang akurat.

## Response Format Actual (Update)

Berdasarkan implementasi backend yang sebenarnya, response memiliki struktur sebagai berikut:

```json
{
  "success": true,
  "data": {
    "user_id": 12,
    "user_name": "User",
    "today_date": "2025-08-23",
    "can_check_in": false,
    "can_check_out": false,
    "has_checked_in_today": true,
    "has_checked_out_today": true,
    "today_attendance": {
      "id": 106,
      "check_in_time": "2025-08-23T06:10:37.000000Z",
      "check_out_time": "2025-08-23T06:33:04.000000Z",
      "date": "2025-08-23T00:00:00.000000Z",
      "location_check_in": "Lat: -7.2130 , Lon: 107.9234",
      "location_check_out": "Lat: -7.2130 , Lon: 107.9234",
      "notes": "Catatan dari user",
      "status": "PRESENT",
      "working_hours": {}
    },
    "monthly_stats": {
      "month": "2025-08",
      "month_name": "August 2025",
      "total_days": 3,
      "present_days": 3,
      "absent_days": 0,
      "late_days": 0,
      "leave_days": 0,
      "sick_days": 0,
      "attendance_rate": 100,
      "total_working_hours": {}
    },
    "recent_attendances": []
  },
  "message": "Status kehadiran berhasil diambil."
}
```

### Status Logic Frontend

Frontend menentukan status attendance berdasarkan:

- `has_checked_out_today: true` → Status: "completed" (Sudah Absen)
- `has_checked_in_today: true` dan `has_checked_out_today: false` → Status: "clock_out_pending" (Pulang)
- `has_checked_in_today: false` → Status: "clock_in_pending" (Masuk)

### Time Display

Waktu check-in dan check-out diambil dari:

- `today_attendance.check_in_time` untuk waktu masuk
- `today_attendance.check_out_time` untuk waktu pulang
- Jika tidak ada data, tampilkan "--:--"

Frontend akan mengkonversi timestamp UTC ke format waktu lokal Indonesia.

## Attendance History Endpoint

Untuk halaman detail kehadiran dengan calendar view, diperlukan endpoint tambahan:

### Route

```php
// Di file routes/api.php
Route::get('/attendances/history', [AttendanceController::class, 'getHistoryApi']);
```

### Controller Method

```php
// Di AttendanceController.php

/**
 * Get attendance history for authenticated user (API)
 */
public function getHistoryApi(Request $request)
{
    try {
        $user = Auth::user();

        // Get month and year from query parameters
        $month = $request->get('month', Carbon::now()->month);
        $year = $request->get('year', Carbon::now()->year);

        // Get attendance records for the specified month/year
        $attendances = Attendance::where('user_id', $user->id)
            ->whereYear('created_at', $year)
            ->whereMonth('created_at', $month)
            ->orderBy('created_at', 'asc')
            ->get();

        $formattedData = $attendances->map(function ($attendance) {
            $status = 'absent';

            if ($attendance->check_out_time) {
                $status = 'present';
            } elseif ($attendance->check_in_time) {
                $status = 'present';
            }

            // Check if it's a leave day (this would depend on your leave system)
            // You might want to join with leave_requests table or have a separate field

            return [
                'id' => $attendance->id,
                'date' => $attendance->created_at->toDateString(),
                'status' => $status,
                'check_in_time' => $attendance->check_in_time,
                'check_out_time' => $attendance->check_out_time,
                'check_in_location' => $attendance->check_in_location,
                'check_out_location' => $attendance->check_out_location,
                'notes' => $attendance->notes,
                'working_hours' => $attendance->check_in_time && $attendance->check_out_time
                    ? $attendance->check_out_time->diffInHours($attendance->check_in_time)
                    : null,
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $formattedData,
            'month' => $month,
            'year' => $year,
            'total_records' => $formattedData->count(),
        ], 200);

    } catch (\Exception $e) {
        Log::error('Error getting attendance history API:', ['error' => $e->getMessage()]);
        return response()->json([
            'success' => false,
            'message' => 'Terjadi kesalahan server.'
        ], 500);
    }
}
```

### Response Format

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "date": "2025-08-01",
      "status": "present",
      "check_in_time": "2025-08-01T08:00:00.000000Z",
      "check_out_time": "2025-08-01T17:00:00.000000Z",
      "check_in_location": "Office Jakarta",
      "check_out_location": "Office Jakarta",
      "notes": "Regular work day",
      "working_hours": 9
    },
    {
      "id": 2,
      "date": "2025-08-02",
      "status": "absent",
      "check_in_time": null,
      "check_out_time": null,
      "check_in_location": null,
      "check_out_location": null,
      "notes": null,
      "working_hours": null
    }
  ],
  "month": "08",
  "year": "2025",
  "total_records": 2
}
```

## Calendar Feature Integration

Frontend akan:

1. Menampilkan calendar dengan 42 grid (6 minggu x 7 hari)
2. Mewarnai setiap tanggal berdasarkan status:
   - **Hijau**: Hadir (present)
   - **Kuning**: Cuti (leave)
   - **Orange**: Sakit (sick)
   - **Merah**: Tidak Hadir (absent)
3. Menampilkan statistik bulanan
4. Allow navigation antar bulan
5. Menampilkan detail saat tanggal diklik

## Updated Implementation Notes (August 2025)

### Actual Backend Response Structure

Berdasarkan implementasi Laravel yang sebenarnya, response memiliki struktur:

```json
{
  "success": true,
  "message": "Riwayat kehadiran berhasil diambil.",
  "data": {
    "attendances": {
      "current_page": 1,
      "data": [
        {
          "id": 1,
          "date": "2025-08-23",
          "check_in_time": "2025-08-23T08:00:00.000000Z",
          "check_out_time": "2025-08-23T17:00:00.000000Z",
          "status": "PRESENT",
          "location_check_in": "Office Jakarta",
          "location_check_out": "Office Jakarta",
          "notes": "Regular work day",
          "working_hours": 9
        }
      ],
      "per_page": 31,
      "total": 1
    },
    "pagination": {...},
    "period": {...},
    "summary": {...}
  }
}
```

### Frontend Parameter Validation

```typescript
// Frontend sends validated parameters
const params = new URLSearchParams();
if (month) {
  const monthNum = parseInt(month, 10);
  if (monthNum >= 1 && monthNum <= 12) {
    params.append('month', monthNum.toString());
  }
}
if (year) {
  const yearNum = parseInt(year, 10);
  if (yearNum >= 2020 && yearNum <= 2100) {
    params.append('year', yearNum.toString());
  }
}
params.append('per_page', '31');
```

### Status Mapping

- `PRESENT`/`LATE` → `present` (Hijau #10B981)
- `ABSENT` → `absent` (Merah #EF4444)
- `LEAVE` → `leave` (Kuning #F59E0B)
- `SICK` → `sick` (Orange #F97316)
