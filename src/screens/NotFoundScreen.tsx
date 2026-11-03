import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/store/StoreContext';
import { Button, Card, EmptyState } from '@/components/ui';
import { EkeaMark } from '@/components/icons';

export function NotFoundScreen() {
  const navigate = useNavigate();
  return (
    <div className="pb-[calc(110px+env(safe-area-inset-bottom,0px))]">
      <div className="ekea-screen mt-[18vh]">
        <EmptyState
          icon={<EkeaMark size={26} />}
          title="Cette page n’existe pas"
          description="Le lien que vous avez suivi ne correspond à aucun écran d’EKEA."
          action={
            <Button full onClick={() => navigate('/')}>
              Revenir à l’accueil
            </Button>
          }
        />
      </div>
    </div>
  );
}
