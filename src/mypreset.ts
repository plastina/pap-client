import { definePreset } from '@primeng/themes';
import Aura from '@primeng/themes/aura';

const feltGreenPalette = {
  50: '#eef5f0',
  100: '#d5e7da',
  200: '#aed0b8',
  300: '#7fb390',
  400: '#57966d',
  500: '#3f7d5a',
  600: '#2f6b4b',
  700: '#25573c',
  800: '#1e4430',
  900: '#1f2a25',
  950: '#121915',
};

const warmStonePalette = {
  50: '#fbfaf6',
  100: '#f3f1ea',
  200: '#e7e3d8',
  300: '#d9d4c7',
  400: '#a9a597',
  500: '#7a7d72',
  600: '#565f58',
  700: '#3a433d',
  800: '#232c27',
  900: '#1a211d',
  950: '#121714',
};

export const MyPreset = definePreset(Aura, {
  primitive: {
    // Toast/message/tag "success" usam a escala green do tema base; aponta pro verde-feltro.
    green: feltGreenPalette,
  },
  semantic: {
    primary: feltGreenPalette,
    neutral: warmStonePalette,
    colorScheme: {
      light: {
        primary: {
          color: '{primary.600}',
          contrastColor: '#ffffff',
          hoverColor: '{primary.700}',
          activeColor: '{primary.800}',
        },
        surface: {
          0: '#fffdf8',
          50: '{neutral.50}',
          100: '{neutral.100}',
          950: '{neutral.950}',
        },
      },
      dark: {
        primary: {
          color: '{primary.300}',
          contrastColor: '#121915',
          hoverColor: '{primary.200}',
          activeColor: '{primary.100}',
        },
        surface: {
          0: '#ffffff',
          50: '{neutral.800}',
          900: '{neutral.900}',
          950: '{neutral.950}',
        },
      },
    },
  },
});
