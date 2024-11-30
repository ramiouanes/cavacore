import { DealProvider } from '../context/deal-context';
import { DealWizardContainer } from '../components/deal-wizard-container';
import { HorseSearchProvider } from '@/features/horses/contexts/horse-search-context';


export const CreateDealPage = () => {
  return (
    <HorseSearchProvider>
      <DealProvider>
        <DealWizardContainer />
      </DealProvider>
    </HorseSearchProvider>
  );
};