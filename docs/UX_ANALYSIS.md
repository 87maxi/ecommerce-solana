# Análisis de UI/UX - web-admin

## Problemas Identificados

### 1. Inconsistencia Visual
- **Problema**: El diseño mezcla esquemas claro y oscuro sin coherencia.
- **Evidencia**:
  - `globals.css` define variables de tema oscuro pero el layout usa `bg-gray-50` (fondo claro)
  - `Header` usa `bg-white` pero `StatsCard` tiene fondo claro
- **Impacto**: Confusión visual, experiencia de usuario fragmentada

### 2. Duplicación de Componentes
- **Problema**: Existen múltiples componentes `WalletConnect` con funcionalidad idéntica
- **Evidencia**:
  - `src/components/WalletConnect.tsx`
  - `src/app/components/WalletConnect.tsx` (ausente, pero referenciado)
- **Impacto**: Dificulta el mantenimiento, riesgo de inconsistencias

### 3. Diseño No Responsivo
- **Problema**: Falta de soporte para móviles
- **Evidencia**:
  - Navegación desaparece en móviles (`hidden md:flex`)
  - No hay menú hamburguesa
- **Impacto**: Inaccesible en dispositivos móviles

### 4. Interacción Limitada
- **Problema**: Componentes estáticos sin feedback
- **Evidencia**:
  - `StatsCard`: clics no tienen efecto
  - `TransactionList`: no se pueden ordenar ni filtrar
- **Impacto**: UX pobre, falta de funcionalidad empresarial

### 5. Accesibilidad
- **Problema**: Contrastes inadecuados y falta de etiquetas
- **Evidencia**:
  - `StatsCard`: iconos sin `aria-label`
  - `TransactionList`: estados sin etiquetas claras
- **Impacto**: Inaccesible para usuarios con discapacidades

## Recomendaciones

### 1. Unificar Sistema de Diseño
- Elegir entre tema claro u oscuro
- Remover variables CSS no utilizadas
- Aplicar paleta coherente

### 2. Estandarizar Componentes
- Unificar `WalletConnect` en una ubicación
- Crear librería de componentes comunes

### 3. Implementar Diseño Responsivo
- Añadir menú hamburguesa para móviles
- Utilizar `@media` queries adecuadas

### 4. Mejorar Interactividad
- Añadir hover effects en `StatsCard`
- Implementar filtros en `TransactionList`

### 5. Garantizar Accesibilidad
- Añadir `aria-labels` a iconos
- Mejorar contraste de color
- Implementar teclado navigation

### 6. Agregar Modo Oscuro/Claro
- Permitir cambio de tema
- Guardar preferencia en `localStorage`