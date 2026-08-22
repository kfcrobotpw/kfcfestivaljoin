import React, { useEffect, useState } from 'react';
import { Navbar } from './components/Navbar';
import { QRScannerModal } from './components/QRScannerModal';
import { PrintableQRModal } from './components/PrintableQRModal';
import { CameraPermissionModal } from './components/CameraPermissionModal';

import { VisitorHomeView } from './views/VisitorHomeView';
import { ScanView } from './views/ScanView';
import { CompletionView } from './views/CompletionView';
import { AdminLoginView } from './views/AdminLoginView';

import { AdminLayout } from './views/admin/AdminLayout';
import { AdminDashboardView } from './views/admin/AdminDashboardView';
import { AdminBoothsView } from './views/admin/AdminBoothsView';
import { AdminQRView } from './views/admin/AdminQRView';
import { AdminParticipantsView } from './views/admin/AdminParticipantsView';
import { AdminCompletedView } from './views/admin/AdminCompletedView';
import { AdminSettingsView } from './views/admin/AdminSettingsView';

import {
  Booth,
  Participant,
  FestivalSettings,
  ScanResult,
} from './types';
import {
  getOrCreateParticipantId,
  allocateNextParticipantId,
  subscribeBooths,
  subscribeParticipant,
  subscribeParticipants,
  ensureDefaultBooths,
  DEFAULT_SETTINGS,
  db,
} from './services/firebaseService';
import { doc, onSnapshot } from 'firebase/firestore';
import {
  checkIsAdminAuthenticated,
  logoutAdmin,
} from './services/adminAuthService';

export default function App() {
  // Routing State
  const [currentView, setCurrentView] = useState<string>('home'); // 'home' | 'scan' | 'complete' | 'admin' | 'admin/dashboard' | 'admin/booths' | 'admin/qr' | 'admin/participants' | 'admin/completed' | 'admin/settings'

  // Data State
  const [participantId, setParticipantId] = useState<string>(() => getOrCreateParticipantId());
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [booths, setBooths] = useState<Booth[]>([]);
  const [allParticipants, setAllParticipants] = useState<Participant[]>([]);
  const [settings, setSettings] = useState<FestivalSettings>(DEFAULT_SETTINGS);

  // Modals
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isPermissionModalOpen, setIsPermissionModalOpen] = useState(false);
  const [selectedQRBooth, setSelectedQRBooth] = useState<Booth | null>(null);

  // Allocate/sync sequential participant ID from Firestore on boot
  useEffect(() => {
    allocateNextParticipantId().then((assignedId) => {
      if (assignedId && assignedId !== participantId) {
        setParticipantId(assignedId);
      }
    });
  }, []);

  // Sync with window URL / hash on mount
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname.replace(/^\//, '');
      const hash = window.location.hash.replace(/^#\/?/, '');
      const route = hash || path;

      if (route.startsWith('admin')) {
        if (!checkIsAdminAuthenticated()) {
          setCurrentView('admin');
        } else {
          setCurrentView(route || 'admin/dashboard');
        }
      } else if (route === 'scan') {
        setCurrentView('scan');
      } else if (route === 'complete') {
        setCurrentView('complete');
      } else {
        setCurrentView('home');
      }
    };

    handlePopState();
    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', handlePopState);
    };
  }, []);

  // Subscribe to Firestore Data
  useEffect(() => {
    ensureDefaultBooths();

    // 1. Subscribe to Booths in Firestore
    const unsubBooths = subscribeBooths((updatedBooths) => {
      setBooths(updatedBooths);
    });

    // 2. Subscribe to current Participant profile in Firestore
    const unsubParticipant = subscribeParticipant(participantId, (updatedPart) => {
      setParticipant(updatedPart);
    });

    // 3. Subscribe to all Participants for Admin live dashboard in Firestore
    const unsubAllParticipants = subscribeParticipants((updatedAll) => {
      setAllParticipants(updatedAll);
    });

    // 4. Subscribe to Settings in Firestore
    const unsubSettings = onSnapshot(doc(db, 'settings', 'general'), (docSnap) => {
      if (docSnap.exists()) {
        setSettings(docSnap.data() as FestivalSettings);
      }
    });

    return () => {
      unsubBooths();
      unsubParticipant();
      unsubAllParticipants();
      unsubSettings();
    };
  }, [participantId]);

  // Navigate helper
  const navigate = (view: string) => {
    // If navigating to admin subviews, check auth
    if (view.startsWith('admin/') && !checkIsAdminAuthenticated()) {
      setCurrentView('admin');
      window.location.hash = 'admin';
      return;
    }

    setCurrentView(view);
    window.location.hash = view === 'home' ? '' : view;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleScanSuccess = (result: ScanResult) => {
    if (result.allCompleted) {
      navigate('complete');
    }
  };

  const handleAdminLogout = () => {
    logoutAdmin();
    navigate('admin');
  };

  const isAdminView = currentView.startsWith('admin');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-white">
      {/* Universal Top Header */}
      <Navbar
        currentView={currentView}
        onNavigate={navigate}
        participantId={participantId}
        isCompleted={participant?.isCompleted}
        onOpenPermissionModal={() => setIsPermissionModalOpen(true)}
      />

      {/* Main View Router */}
      <div className="flex-1">
        {/* Route: / (Visitor Home) */}
        {currentView === 'home' && (
          <VisitorHomeView
            booths={booths}
            participant={participant}
            settings={settings}
            onOpenScanner={() => setIsScannerOpen(true)}
            onNavigateToComplete={() => navigate('complete')}
            onOpenPermissionModal={() => setIsPermissionModalOpen(true)}
          />
        )}

        {/* Route: /scan */}
        {currentView === 'scan' && (
          <ScanView
            participantId={participantId}
            booths={booths}
            onNavigateHome={() => navigate('home')}
            onNavigateToComplete={() => navigate('complete')}
          />
        )}

        {/* Route: /complete */}
        {currentView === 'complete' && (
          <CompletionView
            participant={participant}
            settings={settings}
            booths={booths}
            onNavigateHome={() => navigate('home')}
            onOpenScanner={() => setIsScannerOpen(true)}
          />
        )}

        {/* Route: /admin (Admin Login) */}
        {currentView === 'admin' && (
          <AdminLoginView
            onLoginSuccess={() => navigate('admin/dashboard')}
            onNavigateHome={() => navigate('home')}
          />
        )}

        {/* Route: /admin/* (Admin Dashboard & Submodules) */}
        {isAdminView && currentView !== 'admin' && (
          <AdminLayout
            currentTab={currentView.replace('admin/', '') || 'dashboard'}
            onTabChange={(tab) => navigate(`admin/${tab}`)}
            onLogout={handleAdminLogout}
            onViewAsVisitor={() => navigate('home')}
          >
            {(currentView === 'admin/dashboard' || currentView === 'admin') && (
              <AdminDashboardView
                participants={allParticipants}
                booths={booths}
                onNavigateTab={(tab) => navigate(`admin/${tab}`)}
              />
            )}

            {currentView === 'admin/booths' && (
              <AdminBoothsView
                booths={booths}
                onOpenQRModal={(booth) => setSelectedQRBooth(booth)}
              />
            )}

            {currentView === 'admin/qr' && (
              <AdminQRView
                booths={booths}
                onOpenQRModal={(booth) => setSelectedQRBooth(booth)}
              />
            )}

            {currentView === 'admin/participants' && (
              <AdminParticipantsView
                participants={allParticipants}
                booths={booths}
              />
            )}

            {currentView === 'admin/completed' && (
              <AdminCompletedView
                participants={allParticipants}
                booths={booths}
              />
            )}

            {currentView === 'admin/settings' && (
              <AdminSettingsView
                settings={settings}
                onSaveSettings={(newSettings) => setSettings(newSettings)}
              />
            )}
          </AdminLayout>
        )}
      </div>

      {/* Global QR Scanner Modal */}
      <QRScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        participantId={participantId}
        onSuccess={handleScanSuccess}
        onNavigateToComplete={() => navigate('complete')}
        availableBooths={booths.filter((b) => b.active)}
        onOpenPermissionGuide={() => setIsPermissionModalOpen(true)}
      />

      {/* High-Resolution Printable Stand Modal */}
      <PrintableQRModal
        isOpen={!!selectedQRBooth}
        onClose={() => setSelectedQRBooth(null)}
        booth={selectedQRBooth}
        allBooths={booths}
      />

      {/* Camera Permission Re-request & Step-by-Step Guide Modal */}
      <CameraPermissionModal
        isOpen={isPermissionModalOpen}
        onClose={() => setIsPermissionModalOpen(false)}
        onPermissionGranted={() => {
          setIsScannerOpen(true);
        }}
      />
    </div>
  );
}
