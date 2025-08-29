import { createContext, useContext, useCallback, ReactNode } from 'react';
import introJs from 'intro.js';
import 'intro.js/introjs.css';

// Ensure introJs is properly loaded
console.log('IntroJs loaded:', !!introJs, 'tour method:', typeof introJs?.tour);

interface TourContextType {
  startOverviewTour: () => void;
  startOrdersTour: () => void;
}

const TourContext = createContext<TourContextType | undefined>(undefined);

interface TourProviderProps {
  children: ReactNode;
}

// This part of the code creates focused tour configurations with adaptive positioning
const tourConfigs = {
  overview: {
    steps: [
      {
        intro: "Welcome to your BrandBuddy Overview! Let's explore your operational command center. 🚀"
      },
      {
        element: '[data-tour="kpi-section"]',
        intro: "Key Performance Indicators show your operational health at a glance - revenue, orders, inventory levels.",
        position: 'auto'
      },
      {
        element: '[data-tour="insights-section"]',
        intro: "AI-powered insights provide strategic recommendations from our Operations Director AI.",
        position: 'top'
      },
      {
        element: '[data-tour="header-refresh"]',
        intro: "Keep your data fresh with the refresh button. Real-time updates every 5 minutes!",
        position: 'left'
      },
      {
        intro: "That's your overview tour! Use the sidebar to navigate to other features like Orders and Inventory."
      }
    ]
  },
  orders: {
    steps: [
      {
        intro: "Welcome to Orders Management! Your hub for tracking and managing all customer orders. 📦"
      },
      {
        element: '[data-tour="orders-kpi"]',
        intro: "Monitor order performance with key metrics like total orders, fulfillment rates, and revenue.",
        position: 'bottom'
      },
      {
        element: '[data-tour="orders-table"]',
        intro: "View, search, and manage individual orders. Click on any order for detailed information.",
        position: 'top'
      },
      {
        element: '[data-tour="orders-actions"]',
        intro: "Use these actions to bulk process orders, export data, or create new orders.",
        position: 'bottom'
      },
      {
        intro: "You're all set! Use filters and search to find specific orders, or navigate back to Overview for a complete picture."
      }
    ]
  }
};

export function TourProvider({ children }: TourProviderProps) {
  // This part of the code creates reusable tour functions with enhanced positioning and responsiveness
  const createTour = useCallback((config: any): any => {
    console.log('Creating tour with introJs.tour():', typeof introJs.tour);
    const tour = introJs.tour()
      .setOptions({
        showProgress: true,
        showBullets: false,
        exitOnOverlayClick: false,
        exitOnEsc: true,
        nextLabel: 'Next →',
        prevLabel: '← Back',
        skipLabel: 'Skip Tour',
        doneLabel: 'Got it! ✨',
        tooltipClass: 'brandbuddy-tour',
        highlightClass: 'brandbuddy-tour-highlight',
        disableInteraction: true,
        scrollToElement: true,
        scrollPadding: 30,
        overlayOpacity: 0.8,
        steps: config.steps
      })
      .onbeforeexit(() => {
        return confirm("Are you sure you want to exit the tour?");
      })
      .onchange(() => {
        // This part of the code ensures proper scrolling and timing for each step
        setTimeout(() => {
          const activeElement = document.querySelector('.introjs-helperLayer');
          if (activeElement) {
            activeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 100);
      });
    
    return tour;
  }, []);

  const startOverviewTour = useCallback(() => {
    const tour = createTour(tourConfigs.overview);
    tour.start();
  }, [createTour]);

  const startOrdersTour = useCallback(() => {
    const tour = createTour(tourConfigs.orders);
    tour.start();
  }, [createTour]);

  const value: TourContextType = {
    startOverviewTour,
    startOrdersTour
  };

  return (
    <TourContext.Provider value={value}>
      {children}
    </TourContext.Provider>
  );
}

export function useTour(): TourContextType {
  const context = useContext(TourContext);
  if (context === undefined) {
    throw new Error('useTour must be used within a TourProvider');
  }
  return context;
}
