import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // PayFast Webhook (ITN)
  app.post("/api/payfast-webhook", (req, res) => {
    const data = req.body;
    console.log("PayFast ITN received:", data);
    
    // PayFast security checks would go here (signature verification, etc.)
    // For this demo, we check the payment status
    if (data.payment_status === "COMPLETE") {
      const userId = data.custom_str1; // We'll pass UID in custom_str1
      const planType = data.custom_str2; // 'pro' or 'lifetime'
      
      console.log(`Upgrading user ${userId} to ${planType}`);
      // In a real app, you'd use Firebase Admin SDK here:
      // admin.firestore().doc(`users/${userId}`).update({ isPro: true, plan: planType });
    }
    
    res.status(200).send("OK");
  });

  // Mock PayPal Webhook (Legacy)
  app.post("/api/webhook/paypal", (req, res) => {
    const { event_type, resource } = req.body;
    console.log("PayPal Webhook received:", event_type);
    
    // In a real app, you'd verify the signature and update Firestore here
    // For this demo, we'll just log it.
    // The frontend can poll or use onSnapshot to see the update.
    
    res.status(200).send("OK");
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
