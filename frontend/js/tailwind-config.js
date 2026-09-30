/* Colores y fuentes personalizados de Tailwind (tema DOOM). */

tailwind.config = {
    theme: {
        extend: {
            fontFamily: {
                marvel: ['"Bebas Neue"', 'sans-serif'],
                sans: ['Inter', 'sans-serif'],
            },
            colors: {
                doom: {
                    dark: '#141617',
                    grayDark: '#292C2D',
                    steel: '#6B7072',
                    silver: '#AEB3B5',
                    greenDark: '#1F4D2B',
                    greenMid: '#356B3F',
                    gold: '#C49A3A',
                    brown: '#5A3926'
                }
            }
        }
    }
}
