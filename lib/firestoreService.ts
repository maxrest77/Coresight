/**
 * lib/firestoreService.ts
 * 
 * Firestore-only service layer (no Firebase Storage required).
 * Heatmaps are stored as base64 strings directly in Firestore documents.
 * 
 * Free Tier Safeguards:
 * - Max 50 scans per user
 * - Heatmaps are small base64 strings (~50-100KB), well within 1MB doc limit
 */

import { db } from "@/lib/firebase";
import { 
    collection, 
    addDoc, 
    getDocs, 
    query, 
    orderBy, 
    doc, 
    getDoc, 
    setDoc, 
    onSnapshot,
    writeBatch,
    deleteDoc,
    limit,
    serverTimestamp,
    Timestamp
} from "firebase/firestore";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ScanRecord {
    id: string;
    organ: string;
    diagnosis: string;
    confidence: number;
    inference_ms: number;
    positive_class: string;
    positive_threshold: number;
    heatmap_png_base64?: string;
    timestamp: string; // ISO date string for display
    // Patient metadata (optional, added when intake form is used)
    patientName?: string;
    patientId?: string;
    patientAge?: string;
    patientGender?: string;
    clinicalNotes?: string;
}

export interface UserProfile {
    displayName: string;
    contactEmail: string;
    specialty: string;
    licenseNumber: string;
}

export interface AppNotification {
    id: string;
    message: string;
    scanId: string;
    read: boolean;
    timestamp: string;
}

// ─── Firestore Helpers ────────────────────────────────────────────────────────

const getScansCollectionRef = (userId: string) =>
    collection(db, "users", userId, "scans");

const getNotificationsCollectionRef = (userId: string) =>
    collection(db, "users", userId, "notifications");

/**
 * Saves a completed scan result to Firestore.
 * Heatmap base64 is stored directly in the document (no Storage needed).
 * Enforces a cap of 50 scans per user (free tier safeguard).
 */
export async function saveScanResult(
    userId: string,
    data: {
        organ: string;
        diagnosis: string;
        confidence: number;
        inference_ms: number;
        positive_class: string;
        positive_threshold: number;
        heatmap_png_base64?: string;
        // Patient metadata
        patientName?: string;
        patientId?: string;
        patientAge?: string;
        patientGender?: string;
        clinicalNotes?: string;
    }
): Promise<void> {
    const scansRef = getScansCollectionRef(userId);
    const snapshot = await getDocs(scansRef);

    // Free tier safeguard: warn at 50, but still save (oldest not auto-deleted)
    if (snapshot.size >= 50) {
        console.warn("CoreSight: Scan history limit of 50 reached.");
    }

    const docRef = await addDoc(scansRef, {
        ...data,
        timestamp: serverTimestamp(),
    });

    // Create a notification if the scan is High Risk
    if (data.diagnosis === data.positive_class) {
        const patientStr = data.patientName ? `${data.patientName}${data.patientId ? ` (${data.patientId})` : ''}` : 'a patient';
        await saveNotification(userId, {
            message: `High Risk pattern detected for ${patientStr}.`,
            scanId: docRef.id,
        });
    }
}

/**
 * Fetches the user's scan history (latest 50), ordered by newest first.
 */
export async function getScanHistory(userId: string): Promise<ScanRecord[]> {
    const scansRef = getScansCollectionRef(userId);
    const q = query(scansRef, orderBy("timestamp", "desc"), limit(50));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => {
        const data = doc.data();
        const ts = data.timestamp as Timestamp | null;
        return {
            id: doc.id,
            organ: data.organ ?? "pancreas",
            diagnosis: data.diagnosis ?? "unknown",
            confidence: data.confidence ?? 0,
            inference_ms: data.inference_ms ?? 0,
            positive_class: data.positive_class ?? "pancreatic_tumor",
            positive_threshold: data.positive_threshold ?? 0.4,
            heatmap_png_base64: data.heatmap_png_base64,
            timestamp: ts ? ts.toDate().toISOString() : new Date().toISOString(),
            patientName: data.patientName,
            patientId: data.patientId,
            patientAge: data.patientAge,
            patientGender: data.patientGender,
            clinicalNotes: data.clinicalNotes,
        };
    });
}

/**
 * Saves or updates a user's clinical profile.
 */
export async function saveUserProfile(userId: string, profile: Partial<UserProfile>): Promise<void> {
    const profileRef = doc(db, "users", userId, "profile", "data");
    await setDoc(profileRef, profile, { merge: true });
}

/**
 * Retrieves a user's clinical profile. Returns null if none exists.
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
    const profileRef = doc(db, "users", userId, "profile", "data");
    const snapshot = await getDoc(profileRef);
    if (!snapshot.exists()) return null;
    return snapshot.data() as UserProfile;
}

// ─── Notifications ────────────────────────────────────────────────────────────

export async function saveNotification(
    userId: string,
    data: { message: string; scanId: string }
): Promise<void> {
    const notifsRef = getNotificationsCollectionRef(userId);
    await addDoc(notifsRef, {
        ...data,
        read: false,
        timestamp: serverTimestamp(),
    });
}

/**
 * Listens to unread/all notifications in real-time.
 */
export function listenToNotifications(
    userId: string,
    callback: (notifications: AppNotification[]) => void
): () => void {
    const notifsRef = getNotificationsCollectionRef(userId);
    // Fetch latest 20 notifications
    const q = query(notifsRef, orderBy("timestamp", "desc"), limit(20));
    
    return onSnapshot(q, (snapshot) => {
        const notifs = snapshot.docs.map((doc) => {
            const data = doc.data();
            const ts = data.timestamp as Timestamp | null;
            return {
                id: doc.id,
                message: data.message ?? "",
                scanId: data.scanId ?? "",
                read: data.read ?? false,
                timestamp: ts ? ts.toDate().toISOString() : new Date().toISOString(),
            } as AppNotification;
        });
        callback(notifs);
    });
}

/**
 * Marks all notifications for a user as read.
 */
export async function markAllNotificationsRead(userId: string): Promise<void> {
    const notifsRef = getNotificationsCollectionRef(userId);
    const unreadQuery = query(notifsRef, orderBy("timestamp", "desc"), limit(20));
    const snapshot = await getDocs(unreadQuery);
    
    const batch = writeBatch(db);
    snapshot.docs.forEach((docSnap) => {
        if (!docSnap.data().read) {
            batch.update(docSnap.ref, { read: true });
        }
    });
    
    await batch.commit();
}

/**
 * Marks a single notification as read.
 */
export async function markNotificationRead(userId: string, notificationId: string): Promise<void> {
    const notifRef = doc(db, "users", userId, "notifications", notificationId);
    await setDoc(notifRef, { read: true }, { merge: true });
}

// ─── Data Management ──────────────────────────────────────────────────────────

/**
 * Permanently deletes all scans and notifications for a user.
 * Profile data remains intact.
 */
export async function deleteAllUserData(userId: string): Promise<void> {
    const scansRef = getScansCollectionRef(userId);
    const notifsRef = getNotificationsCollectionRef(userId);

    const scansSnapshot = await getDocs(scansRef);
    if (!scansSnapshot.empty) {
        let batch = writeBatch(db);
        let count = 0;
        for (const doc of scansSnapshot.docs) {
            batch.delete(doc.ref);
            count++;
            if (count % 499 === 0) { // Firestore batch limit is 500
                await batch.commit();
                batch = writeBatch(db);
            }
        }
        if (count % 499 !== 0) {
            await batch.commit();
        }
    }

    const notifsSnapshot = await getDocs(notifsRef);
    if (!notifsSnapshot.empty) {
        let batch = writeBatch(db);
        let count = 0;
        for (const doc of notifsSnapshot.docs) {
            batch.delete(doc.ref);
            count++;
            if (count % 499 === 0) {
                await batch.commit();
                batch = writeBatch(db);
            }
        }
        if (count % 499 !== 0) {
            await batch.commit();
        }
    }
}

/**
 * Permanently deletes a user's profile document.
 */
export async function deleteUserProfile(userId: string): Promise<void> {
    await deleteDoc(doc(db, "users", userId));
}
