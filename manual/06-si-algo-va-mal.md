# 6. Si algo va mal

| Problema | Qué hacer |
|---|---|
| Un producto no aparece en la web | ¿Está **activo** (no archivado) en Stripe y tiene precio en EUR? Usa el enlace de **"refrescar tienda"** que te dejó {contactoTecnico}. Si sigue sin salir, avisa a {contactoTecnico}. |
| Un cliente dice que pagó pero no ves el pago | En **Pagos**, busca por su email. Si no está, no se completó el pago: pídele que lo intente de nuevo. |
| Email de Stripe sobre una "disputa" (chargeback) | El cliente reclamó al banco. Entra en el aviso, aporta lo que Stripe pida (justificante de envío, emails). Tiene fecha límite: no lo dejes pasar. |
| La web está caída | Avisa a {contactoTecnico}. (Los pagos en curso de {storeName} en Stripe no se pierden.) |
| Te piden borrar sus datos (GDPR) | Reenvía el email a {contactoTecnico}; hay obligación de responder en un mes. |

**Tu sesión de Stripe es la llave de la caja**: usa una contraseña fuerte, activa la verificación en dos pasos y no la compartas con nadie. La encuentras en el icono del engranaje (⚙️, arriba a la derecha) → **Configuración** → **Seguridad**: ahí verás un interruptor para activarla — sigue las instrucciones que te muestre Stripe en pantalla.
