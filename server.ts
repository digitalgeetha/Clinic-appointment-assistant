import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { dbService } from './server/db';
import { processChatConversation } from './server/gemini';
import { CLINIC_INFO } from './server/clinicInfo';

dotenv.config();

const PORT = 3000;

async function startServer() {
  const app = express();

  // JSON Body Parser
  app.use(express.json());

  // API Routes FIRST
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'Clinic Appointment Assistant',
      clinic: CLINIC_INFO.name,
      timestamp: new Date().toISOString(),
    });
  });

  // Clinic static approved information
  app.get('/api/clinic-info', (req, res) => {
    res.json(CLINIC_INFO);
  });

  // Database and Assistant status
  app.get('/api/status', async (req, res) => {
    try {
      const dbStatus = await dbService.getDatabaseStatus();
      res.json({
        success: true,
        clinic: CLINIC_INFO.name,
        database: dbStatus,
        geminiConfigured: !!process.env.GEMINI_API_KEY,
        currentReferenceDate: '2026-09-09',
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Conversational AI Chat Endpoint
  app.post('/api/chat', async (req, res) => {
    try {
      const { messages } = req.body;
      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: 'Messages array is required' });
      }

      const response = await processChatConversation(messages);
      res.json(response);
    } catch (err: any) {
      console.error('Chat endpoint error:', err);
      res.status(500).json({
        error: 'Failed to process chat message',
        message: err.message,
      });
    }
  });

  // Get available appointment slots for a specific date
  app.get('/api/appointments/available', async (req, res) => {
    try {
      const date = (req.query.date as string) || '2026-09-10';
      const slots = await dbService.getAvailableSlots(date);
      res.json({
        date,
        count: slots.length,
        slots,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Get all slots (for reviewer inspection and audit)
  app.get('/api/appointments/all', async (req, res) => {
    try {
      const slots = await dbService.getAllSlots();
      res.json({
        count: slots.length,
        slots,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Book an appointment slot
  app.post('/api/appointments/book', async (req, res) => {
    try {
      const { slot_id, date, time, patient_name, patient_email, patient_phone, notes } = req.body;
      const result = await dbService.bookAppointment({
        slot_id,
        date,
        time,
        patient_name,
        patient_email,
        patient_phone,
        notes,
      });

      if (!result.success) {
        return res.status(result.error === 'SLOT_ALREADY_BOOKED' ? 409 : 400).json(result);
      }

      res.status(201).json(result);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Reschedule an appointment
  app.post('/api/appointments/reschedule', async (req, res) => {
    try {
      const { booking_reference, new_slot_id } = req.body;
      if (!booking_reference || !new_slot_id) {
        return res.status(400).json({
          success: false,
          message: 'Both booking_reference and new_slot_id are required',
        });
      }

      const result = await dbService.rescheduleAppointment({
        booking_reference,
        new_slot_id,
      });

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.json(result);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Cancel an appointment
  app.post('/api/appointments/cancel', async (req, res) => {
    try {
      const { booking_reference, reason } = req.body;
      if (!booking_reference) {
        return res.status(400).json({
          success: false,
          message: 'Booking reference is required',
        });
      }

      const result = await dbService.cancelAppointment({
        booking_reference,
        reason,
      });

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.json(result);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Lookup booking details
  app.get('/api/appointments/booking/:reference', async (req, res) => {
    try {
      const reference = req.params.reference;
      const booking = await dbService.getBookingByReference(reference);

      if (!booking) {
        return res.status(404).json({
          success: false,
          message: 'Booking not found with that reference',
        });
      }

      res.json({ success: true, booking });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Reset & Reseed database slots (for test reset)
  app.post('/api/appointments/seed', async (req, res) => {
    try {
      const result = await dbService.reseedDatabase();
      res.json({
        success: true,
        message: `Database successfully reseeded with ${result.count} realistic slots.`,
        count: result.count,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Clinic Appointment Assistant server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
