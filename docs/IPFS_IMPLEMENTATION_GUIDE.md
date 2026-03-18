# Guía de Implementación: IPFS para Facturación Descentralizada

Este documento explica en detalle cómo funciona IPFS dentro del ecosistema de E-commerce Solana y cómo se ha implementado la generación y almacenamiento de facturas.

## 1. ¿Qué es IPFS?

**IPFS (InterPlanetary File System)** es un protocolo y una red peer-to-peer diseñada para crear un método persistente y distribuido de almacenamiento y compartición de archivos.

### Conceptos Clave:
*   **Direccionamiento por Contenido (CID):** A diferencia de la web tradicional (HTTP) donde buscas un archivo por su ubicación (ej. `servidor.com/factura.pdf`), en IPFS buscas el archivo por **lo que contiene**. Si cambias un solo bit del archivo, su dirección (Hash/CID) cambia por completo.
*   **Inmutabilidad:** Una vez que una factura se sube a IPFS, el CID generado es único para esa versión del archivo. Esto garantiza que la factura no pueda ser alterada sin cambiar su identificador.
*   **Descentralización:** Los archivos no residen en un único servidor central, sino que pueden ser servidos por cualquier nodo que tenga una copia del archivo.

## 2. Flujo de Implementación en el Proyecto

El sistema utiliza IPFS para almacenar los reportes de pago en PDF de forma que sean accesibles pero inmutables.

### Diagrama de Secuencia:
1.  **Frontend (`web-customer`):** Confirma el pago exitoso en la blockchain de Solana.
2.  **API Backend (`web-admin`):** Recibe los datos de la transacción, genera un PDF dinámico usando `pdf-lib`.
3.  **IPFS (Kubo Node):** El backend sube el Buffer del PDF al nodo local de IPFS.
4.  **Respuesta:** El nodo devuelve un **CID** (ej. `QmXoyp...`).
5.  **Blockchain:** El frontend toma ese CID y lo guarda permanentemente en el Smart Contract de Solana dentro de la cuenta `Invoice`.

## 3. Detalles Técnicos de la Implementación

### Cliente de Conexión (`web-admin/src/lib/ipfs-local.ts`)
Utilizamos la librería `kubo-rpc-client` para comunicarnos con el demonio de IPFS.

```typescript
import { create } from 'kubo-rpc-client';

// Conexión al nodo local (puerto 5001 por defecto para la API)
const ipfs = create({ url: 'http://127.0.0.1:5001' });

export async function uploadToIPFS(fileBuffer: Buffer): Promise<string> {
  const { cid } = await ipfs.add(fileBuffer);
  return cid.toString();
}
```

### Generación de Factura (`web-admin/src/app/api/generate-invoice/route.ts`)
El endpoint recibe los datos de la compra y construye el documento:

*   **Librería:** `pdf-lib` para manipulación de documentos en memoria.
*   **Contenido:** Incluye el ID de orden, fecha, dirección de la wallet del cliente, total en EURT y el Hash de la transacción de Solana.
*   **Seguridad:** El PDF se genera en el servidor para evitar manipulaciones en el lado del cliente antes de subirlo a IPFS.

### Recuperación y Visualización
Para visualizar las facturas, el frontend utiliza un **Gateway de IPFS**.
*   **URL Local:** `http://localhost:8080/ipfs/[CID]`
*   **Implementación:** En `web-customer/src/app/orders/page.tsx`, el botón "View Receipt" construye este enlace dinámicamente usando el CID recuperado de la blockchain.

## 4. Requisitos de Infraestructura

Para que esta funcionalidad opere correctamente en entorno de desarrollo, es necesario tener instalado y corriendo **IPFS Desktop** o **Kubo CLI**.

1.  **Instalación:** [Descargar IPFS Desktop](https://docs.ipfs.tech/install/ipfs-desktop/)
2.  **Configuración de CORS:** Para permitir que el backend se comunique con el nodo local, se deben ejecutar los siguientes comandos en la terminal (una sola vez):

```bash
ipfs config --json API.HTTPHeaders.Access-Control-Allow-Origin '["*"]'
ipfs config --json API.HTTPHeaders.Access-Control-Allow-Methods '["PUT", "POST", "GET"]'
```

3.  **Puertos Utilizados:**
    *   `5001`: API de control (donde el backend sube archivos).
    *   `8080`: Gateway público (donde el navegador lee los archivos).
    *   `4001`: Puerto de comunicación entre nodos IPFS (P2P).

## 5. Ventajas de este Modelo
*   **Transparencia:** El cliente tiene un comprobante físico cuyo contenido está vinculado matemáticamente a la transacción en la blockchain.
*   **Eficiencia On-Chain:** Guardar un PDF entero en Solana sería extremadamente costoso. Guardar un CID (string corto) es barato y eficiente.
*   **Persistencia:** Mientras al menos un nodo (el de la empresa o el del cliente) mantenga el archivo "pinneado", la factura existirá para siempre.