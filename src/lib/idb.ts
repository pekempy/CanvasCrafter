export const getDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open("canvascrafter_db", 1);
        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains("custom_fonts")) {
                db.createObjectStore("custom_fonts", { keyPath: "name" });
            }
        };
        request.onsuccess = (event) => resolve((event.target as IDBOpenDBRequest).result);
        request.onerror = (event) => reject((event.target as IDBOpenDBRequest).error);
    });
};

export const saveCustomFont = async (name: string, dataUrl: string) => {
    const db = await getDB();
    return new Promise<void>((resolve, reject) => {
        const tx = db.transaction("custom_fonts", "readwrite");
        const store = tx.objectStore("custom_fonts");
        store.put({ name, dataUrl });
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
};

export const getCustomFonts = async (): Promise<{ name: string; dataUrl: string }[]> => {
    const db = await getDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction("custom_fonts", "readonly");
        const store = tx.objectStore("custom_fonts");
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

export const deleteCustomFont = async (name: string) => {
    const db = await getDB();
    return new Promise<void>((resolve, reject) => {
        const tx = db.transaction("custom_fonts", "readwrite");
        const store = tx.objectStore("custom_fonts");
        store.delete(name);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
};
