/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Azul bebé — a cor da casa.
        azul: {
          50: '#f4fafd',
          100: '#eaf5fc',
          200: '#d3e9f7',
          300: '#a9d2ec',
          400: '#8fc4e8',
          500: '#6da9d6',
          600: '#4f8dbd',
          700: '#3d7099',
          800: '#2f5878',
          900: '#234b66',
        },
        tinta: {
          DEFAULT: '#2f3d4a',
          suave: '#6b7885',
        },
        // Cores dos estados dos artigos, validadas para contraste e daltonismo.
        estado: {
          verde: '#2f7d55',
          'verde-fundo': '#eaf7f0',
          ambar: '#9c6206',
          'ambar-fundo': '#fdf4e5',
          amarelo: '#8a6d1f',
          'amarelo-fundo': '#fbf6e6',
          rosa: '#a8474a',
          'rosa-fundo': '#fdf0f0',
        },
        // Cor única dos gráficos: as barras medem grandeza, não identidade.
        grafico: '#3b7fb5',
      },
      fontFamily: {
        sans: ['Nunito', 'Segoe UI', 'system-ui', '-apple-system', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      borderRadius: {
        card: '20px',
        pill: '999px',
      },
      boxShadow: {
        suave: '0 10px 30px rgba(40, 80, 100, 0.07)',
        forte: '0 18px 45px rgba(30, 60, 85, 0.18)',
        botao: '0 8px 18px rgba(109, 169, 214, 0.35)',
      },
      maxWidth: {
        conteudo: '1120px',
      },
      keyframes: {
        entrar: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        brilho: {
          from: { backgroundPosition: '200% 0' },
          to: { backgroundPosition: '-200% 0' },
        },
      },
      animation: {
        entrar: 'entrar 0.25s ease',
        brilho: 'brilho 1.4s infinite',
      },
    },
  },
  plugins: [],
};
