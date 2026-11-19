/**
 * RESTO DADDY - Offline-First Resilience & Sync Manager
 * Ensures uninterrupted POS and Order taking during network outages with guaranteed reconciliation.
 */

class OfflineSyncManager {
    constructor() {
        this.storageKey = 'resto_daddy_offline_orders';
        this.clientId = 'pos-terminal-' + Math.random().toString(36).substring(2, 9);
        this.isSimulatedOffline = false;
        this.isSyncing = false;
        this.init();
    }

    init() {
        window.addEventListener('online', () => this.handleNetworkChange());
        window.addEventListener('offline', () => this.handleNetworkChange());
        this.updateBadge();

        // Attempt sync immediately if online and pending orders exist
        if (this.isOnline()) {
            this.syncQueue();
        }
    }

    isOnline() {
        return navigator.onLine && !this.isSimulatedOffline;
    }

    toggleSimulateOffline(simulate) {
        this.isSimulatedOffline = simulate;
        this.handleNetworkChange();
    }

    handleNetworkChange() {
        this.updateBadge();
        if (this.isOnline()) {
            this.syncQueue();
        }
    }

    getQueue() {
        try {
            const raw = localStorage.getItem(this.storageKey);
            return raw ? JSON.parse(raw) : [];
        } catch (e) {
            return [];
        }
    }

    saveQueue(queue) {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(queue));
            this.updateBadge();
        } catch (e) {
            console.error("Failed to save offline queue", e);
        }
    }

    enqueueOrder(orderData) {
        const queue = this.getQueue();
        // Ensure unique client UUID
        if (!orderData.order_id) {
            orderData.order_id = (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : 'offline-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
        }
        orderData.queued_at = new Date().toISOString();
        queue.push(orderData);
        this.saveQueue(queue);
        console.log("💾 Order queued offline:", orderData.order_id);
        return orderData.order_id;
    }

    async syncQueue() {
        const queue = this.getQueue();
        if (queue.length === 0 || this.isSyncing || !this.isOnline()) return;

        this.isSyncing = true;
        this.updateBadge("syncing");

        try {
            const response = await fetch('/api/orders/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    client_id: this.clientId,
                    orders: queue
                })
            });

            if (response.ok) {
                const result = await response.json();
                console.log("✓ Successfully synchronized offline orders:", result);
                localStorage.removeItem(this.storageKey);
                this.updateBadge("online");
                if (window.showToast) {
                    window.showToast(`✓ Synced ${result.synced_count} offline order(s) successfully!`, "success");
                }
                // Refresh dashboard / orders view
                window.dispatchEvent(new CustomEvent('offline:sync_complete', { detail: result }));
            } else {
                console.error("Sync failed with status:", response.status);
                this.updateBadge("failed");
            }
        } catch (e) {
            console.error("Network error during sync:", e);
            this.updateBadge("offline");
        } finally {
            this.isSyncing = false;
        }
    }

    updateBadge(statusOverride) {
        const badge = document.getElementById('connection-status-badge');
        if (!badge) return;

        const queueCount = this.getQueue().length;
        const online = this.isOnline();

        if (statusOverride === 'syncing' || this.isSyncing) {
            badge.className = "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200";
            badge.innerHTML = `<span class="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span> Syncing (${queueCount})`;
        } else if (!online) {
            badge.className = "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 cursor-pointer";
            badge.innerHTML = `<span class="w-2 h-2 rounded-full bg-amber-500"></span> Offline (${queueCount} Queued)`;
            badge.title = "Click to toggle simulated offline mode";
        } else {
            badge.className = "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200";
            badge.innerHTML = `<span class="w-2 h-2 rounded-full bg-emerald-500"></span> Online`;
        }
    }
}

window.offlineManager = new OfflineSyncManager();
