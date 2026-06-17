<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Attachment;
use App\Models\Referral;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class AttachmentController extends Controller
{
    public function index(Referral $referral)
    {
        return response()->json($referral->attachments()->with('uploadedBy')->get());
    }

    public function store(Request $request, Referral $referral)
    {
        $request->validate([
            'file' => 'required|file|max:10240|mimes:pdf,jpg,jpeg,png,doc,docx,xlsx',
        ]);

        $file = $request->file('file');
        $path = $file->store('referral-attachments/' . $referral->id, 'local');

        $attachment = Attachment::create([
            'referral_id'  => $referral->id,
            'uploaded_by'  => $request->user()->id,
            'file_name'    => $file->getClientOriginalName(),
            'file_path'    => $path,
            'mime_type'    => $file->getMimeType(),
            'file_size'    => $file->getSize(),
        ]);

        return response()->json($attachment->load('uploadedBy'), 201);
    }

    public function download(Referral $referral, Attachment $attachment)
    {
        if (!Storage::disk('local')->exists($attachment->file_path)) {
            return response()->json(['message' => 'File not found.'], 404);
        }

        return Storage::disk('local')->download(
            $attachment->file_path,
            $attachment->file_name,
            ['Content-Type' => $attachment->mime_type]
        );
    }

    public function destroy(Referral $referral, Attachment $attachment)
    {
        Storage::disk('local')->delete($attachment->file_path);
        $attachment->delete();
        return response()->json(null, 204);
    }
}
