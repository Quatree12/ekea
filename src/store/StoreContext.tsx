import { createContext, useContext, useEffect, useMemo, useReducer, type ReactNode } from 'react';
import type {
  AnalysisCapabilities,
  EkeaAction,
  EkeaDeadline,
  EkeaDocument,
  EkeaProfile,
  ExtractedData,
  ReminderOffset,
  ToastMessage,
} from '@/types';
import { readJSON, writeJSON } from '@/lib/storage';
import { createAction, createDeadline, isDuplicateDeadline } from '@/lib/factory';
import { makeId } from '@/lib/ids';
import { getAnalysisCapabilities } from '@/lib/analysis';
import { todayISO } from '@/lib/format';
import { buildDemoBundle } from '@/lib/demo';

/* -------------------------------------------------------------------------- */
/*  État                                                                      */
/* -------------------------------------------------------------------------- */

interface State {
  ready: boolean;
  documents: EkeaDocument[];
  deadlines: EkeaDeadline[];
  actions: EkeaAction[];
  profile: EkeaProfile;
  toasts: ToastMessage[];
  capabilities: AnalysisCapabilities;
  /** Le coffre contient des données d’exemple non supprimées par l’utilisateur. */
  hasDemo: boolean;
}

const DEFAULT_PROFILE: EkeaProfile = {
  firstName: '',
  lastName: '',
  email: '',
  language: 'fr',
  canton: 'VD',
  notifications: {
    enabled: false,
    time: '08:00',
    deadlineAlerts: true,
    weeklySummary: false,
  },
  privacy: {
    cloudProcessingConsent: false,
    consentDate: null,
  },
  security: {
    pinEnabled: false,
    pinHash: null,
  },
  appearance: 'system',
};

const initialState: State = {
  ready: false,
  documents: [],
  deadlines: [],
  actions: [],
  profile: DEFAULT_PROFILE,
  toasts: [],
  capabilities: getAnalysisCapabilities(),
  hasDemo: false,
};

/* -------------------------------------------------------------------------- */
/*  Actions                                                                   */
/* -------------------------------------------------------------------------- */

type Action =
  | { type: 'hydrate'; payload: Partial<State> }
  | { type: 'addDocuments'; documents: EkeaDocument[] }
  | { type: 'updateDocument'; id: string; patch: Partial<EkeaDocument> }
  | { type: 'deleteDocument'; id: string }
  | { type: 'setDocumentData'; id: string; data: ExtractedData; historyLabel: string }
  | { type: 'addDeadline'; deadline: EkeaDeadline }
  | { type: 'updateDeadline'; id: string; patch: Partial<EkeaDeadline> }
  | { type: 'deleteDeadline'; id: string }
  | { type: 'addAction'; action: EkeaAction }
  | { type: 'updateAction'; id: string; patch: Partial<EkeaAction> }
  | { type: 'deleteAction'; id: string }
  | { type: 'setProfile'; patch: Partial<EkeaProfile> }
  | { type: 'pushToast'; toast: ToastMessage }
  | { type: 'dismissToast'; id: string }
  | { type: 'clearDemo' }
  | { type: 'setDemoFlag'; value: boolean }
  | { type: 'reset' };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'hydrate':
      return { ...state, ...action.payload, ready: true };

    case 'addDocuments':
      return { ...state, documents: [...action.documents, ...state.documents] };

    case 'updateDocument':
      return {
        ...state,
        documents: state.documents.map((doc) =>
          doc.id === action.id
            ? { ...doc, ...action.patch, updatedAt: new Date().toISOString() }
            : doc,
        ),
      };

    case 'setDocumentData':
      return {
        ...state,
        documents: state.documents.map((doc) =>
          doc.id === action.id
            ? {
                ...doc,
                data: action.data,
                updatedAt: new Date().toISOString(),
                history: [
                  ...doc.history,
                  {
                    id: makeId('hist'),
                    at: new Date().toISOString(),
                    actor: 'user' as const,
                    label: action.historyLabel,
                  },
                ],
              }
            : doc,
        ),
      };

    case 'deleteDocument':
      return {
        ...state,
        documents: state.documents.filter((doc) => doc.id !== action.id),
        deadlines: state.deadlines.filter((d) => d.documentId !== action.id),
        actions: state.actions.filter((a) => a.documentId !== action.id),
      };

    case 'addDeadline':
      return { ...state, deadlines: [...state.deadlines, action.deadline] };

    case 'updateDeadline':
      return {
        ...state,
        deadlines: state.deadlines.map((d) => (d.id === action.id ? { ...d, ...action.patch } : d)),
      };

    case 'deleteDeadline':
      return { ...state, deadlines: state.deadlines.filter((d) => d.id !== action.id) };

    case 'addAction':
      return { ...state, actions: [...state.actions, action.action] };

    case 'updateAction':
      return {
        ...state,
        actions: state.actions.map((a) => (a.id === action.id ? { ...a, ...action.patch } : a)),
      };

    case 'deleteAction':
      return { ...state, actions: state.actions.filter((a) => a.id !== action.id) };

    case 'setProfile':
      return { ...state, profile: { ...state.profile, ...action.patch } };

    case 'pushToast':
      return { ...state, toasts: [...state.toasts, action.toast] };

    case 'dismissToast':
      return { ...state, toasts: state.toasts.filter((t) => t.id !== action.id) };

    case 'clearDemo':
      return {
        ...state,
        documents: state.documents.filter((d) => !d.analysis.demoMode),
        deadlines: state.deadlines.filter((d) => !d.id.startsWith('demo-')),
        actions: state.actions.filter((a) => !a.id.startsWith('demo-')),
        hasDemo: false,
      };

    case 'setDemoFlag':
      return { ...state, hasDemo: action.value };

    case 'reset':
      return { ...initialState, ready: true, capabilities: state.capabilities };

    default:
      return state;
  }
}

/* -------------------------------------------------------------------------- */
/*  Contexte                                                                  */
/* -------------------------------------------------------------------------- */

interface StoreValue extends State {
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  dismissToast: (id: string) => void;
  importDocuments: (docs: EkeaDocument[]) => void;
  updateDocument: (id: string, patch: Partial<EkeaDocument>) => void;
  deleteDocument: (id: string) => void;
  saveDocumentData: (id: string, data: ExtractedData, historyLabel: string) => void;
  confirmDocument: (id: string) => void;
  addDeadline: (input: {
    documentId: string | null;
    actionId?: string | null;
    title: string;
    organization: string;
    fromDocument: boolean;
    date: string;
    amount?: number | null;
    priority?: EkeaDeadline['priority'];
  }) => EkeaDeadline | null;
  updateDeadline: (id: string, patch: Partial<EkeaDeadline>) => void;
  deleteDeadline: (id: string) => void;
  addAction: (input: {
    documentId: string;
    title: string;
    explanation: string;
    suggested: boolean;
    confirmed?: boolean;
    priority?: EkeaAction['priority'];
    dueDate?: string | null;
    steps: string[];
    requiredDocuments?: string[];
    channel?: string | null;
  }) => EkeaAction;
  updateAction: (id: string, patch: Partial<EkeaAction>) => void;
  deleteAction: (id: string) => void;
  toggleStep: (actionId: string, stepId: string) => void;
  setProfile: (patch: Partial<EkeaProfile>) => void;
  loadDemo: () => void;
  clearDemo: () => void;
  resetAll: () => void;
  updateReminders: (id: string, offsets: ReminderOffset[]) => void;
}

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  /* --- Hydratation depuis le stockage local ------------------------------ */
  useEffect(() => {
    const documents = readJSON<EkeaDocument[]>('documents', []);
    const deadlines = readJSON<EkeaDeadline[]>('deadlines', []);
    const actions = readJSON<EkeaAction[]>('actions', []);
    const profile = readJSON<EkeaProfile>('profile', DEFAULT_PROFILE);
    const hasDemo = documents.some((d) => d.analysis.demoMode);

    dispatch({
      type: 'hydrate',
      payload: {
        documents,
        deadlines,
        actions,
        profile: { ...DEFAULT_PROFILE, ...profile },
        hasDemo,
      },
    });
  }, []);

  /* --- Persistance -------------------------------------------------------- */
  useEffect(() => {
    if (!state.ready) return;
    writeJSON('documents', state.documents);
  }, [state.documents, state.ready]);

  useEffect(() => {
    if (!state.ready) return;
    writeJSON('deadlines', state.deadlines);
  }, [state.deadlines, state.ready]);

  useEffect(() => {
    if (!state.ready) return;
    writeJSON('actions', state.actions);
  }, [state.actions, state.ready]);

  useEffect(() => {
    if (!state.ready) return;
    writeJSON('profile', state.profile);
  }, [state.profile, state.ready]);

  /* --- Marqueur d’échéances dépassées ------------------------------------ */
  useEffect(() => {
    if (!state.ready) return;
    const today = todayISO();
    state.deadlines.forEach((deadline) => {
      if (deadline.status === 'open' && deadline.date < today) {
        dispatch({ type: 'updateDeadline', id: deadline.id, patch: { status: 'missed' } });
      }
    });
    // Volontairement exécuté au chargement uniquement.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.ready]);

  const value = useMemo<StoreValue>(() => {
    const addToast = (toast: Omit<ToastMessage, 'id'>) => {
      const id = makeId('toast');
      dispatch({ type: 'pushToast', toast: { ...toast, id } });
      window.setTimeout(() => dispatch({ type: 'dismissToast', id }), 4200);
    };

    return {
      ...state,
      addToast,
      dismissToast: (id) => dispatch({ type: 'dismissToast', id }),

      importDocuments: (docs) => {
        dispatch({ type: 'addDocuments', documents: docs });
      },

      updateDocument: (id, patch) => dispatch({ type: 'updateDocument', id, patch }),

      deleteDocument: (id) => {
        dispatch({ type: 'deleteDocument', id });
        addToast({
          tone: 'success',
          title: 'Document supprimé',
          detail: 'Le fichier et ses données ont été retirés de cet appareil.',
        });
      },

      saveDocumentData: (id, data, historyLabel) =>
        dispatch({ type: 'setDocumentData', id, data, historyLabel }),

      confirmDocument: (id) => dispatch({ type: 'updateDocument', id, patch: { status: 'confirmed' } }),

      /** Crée une échéance en refusant les doublons. */
      addDeadline: (input) => {
        const duplicate = isDuplicateDeadline(
          state.deadlines,
          input.documentId,
          input.date,
          input.title,
        );
        if (duplicate) {
          addToast({
            tone: 'warning',
            title: 'Échéance déjà enregistrée',
            detail: 'Aucun rappel en double n’a été créé.',
          });
          return null;
        }
        const deadline = createDeadline(input);
        dispatch({ type: 'addDeadline', deadline });
        return deadline;
      },

      updateDeadline: (id, patch) => dispatch({ type: 'updateDeadline', id, patch }),
      deleteDeadline: (id) => dispatch({ type: 'deleteDeadline', id }),
      updateReminders: (id, offsets) =>
        dispatch({ type: 'updateDeadline', id, patch: { reminderOffsets: offsets } }),

      addAction: (input) => {
        const action = createAction(input);
        dispatch({ type: 'addAction', action });
        return action;
      },

      updateAction: (id, patch) => dispatch({ type: 'updateAction', id, patch }),
      deleteAction: (id) => dispatch({ type: 'deleteAction', id }),

      toggleStep: (actionId, stepId) => {
        const target = state.actions.find((a) => a.id === actionId);
        if (!target) return;
        const steps = target.steps.map((step) =>
          step.id === stepId
            ? { ...step, done: !step.done, doneAt: !step.done ? new Date().toISOString() : undefined }
            : step,
        );
        const everyDone = steps.every((s) => s.done);
        const someDone = steps.some((s) => s.done);
        dispatch({
          type: 'updateAction',
          id: actionId,
          patch: {
            steps,
            status: everyDone ? 'done' : someDone ? 'in_progress' : 'todo',
            completedAt: everyDone ? new Date().toISOString() : undefined,
          },
        });
      },

      setProfile: (patch) => dispatch({ type: 'setProfile', patch }),

      loadDemo: () => {
        const bundle = buildDemoBundle();
        dispatch({ type: 'addDocuments', documents: bundle.documents });
        bundle.deadlines.forEach((deadline) => dispatch({ type: 'addDeadline', deadline }));
        bundle.actions.forEach((action) => dispatch({ type: 'addAction', action }));
        dispatch({ type: 'setDemoFlag', value: true });
      },

      clearDemo: () => {
        dispatch({ type: 'clearDemo' });
        addToast({ tone: 'success', title: 'Exemples supprimés' });
      },

      resetAll: () => dispatch({ type: 'reset' }),
    };
  }, [state]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore doit être utilisé dans StoreProvider');
  return ctx;
}
