# 6. Si algo va mal

| Problema | Qué hacer |
|---|---|
| Un producto no aparece en la web | ¿Está **activo** (no archivado) en Stripe y tiene precio en EUR? Usa el enlace de **"refrescar tienda"**. Si tiene el mismo Nombre que otro producto tuyo, mira la sección 1 (casilla `variant`) — es la causa más habitual. Si sigue sin salir tras unos minutos, abre el producto y guárdalo de nuevo sin cambiar nada (a veces basta para que se sincronice). Si aun así no aparece, es un caso raro: mira el aviso al final de esta página sobre pedir ayuda técnica. |
| Un cliente dice que pagó pero no ves el pago | En **Pagos**, busca por su email. Si no está, no se completó el pago: pídele que lo intente de nuevo. |
| Email de Stripe sobre una "disputa" (chargeback) | El cliente reclamó al banco. Entra en el aviso, aporta lo que Stripe pida (justificante de envío, emails). Tiene fecha límite: no lo dejes pasar. |
| La web está caída | Primero comprueba que no es solo tu conexión: pruébala desde el móvil con datos, sin wifi. Si sigue sin cargar para todo el mundo, es un problema técnico real (mira el aviso final sobre pedir ayuda). Mientras tanto, tranquila: **los pagos que ya se hicieron no se pierden**, viven en Stripe, no en la web. |
| Te piden borrar sus datos (GDPR) | No lo decidas tú sola: consulta con tu **gestoría/asesor fiscal** (el mismo que te lleva las facturas) — ellos saben qué datos hay que conservar por obligación legal (facturas, varios años) y cuáles sí se pueden borrar. Hay un mes de plazo para responder al cliente. |
| Se te olvida la contraseña de Stripe, o pierdes el acceso a tu email | Es tu cuenta, no depende de nadie más: en la pantalla de acceso de Stripe usa "¿Olvidaste tu contraseña?". Si además perdiste el acceso al email con el que te diste de alta, contacta directamente con el **soporte de Stripe** (dashboard.stripe.com/support o help.stripe.com) — te pedirán verificar tu identidad. |
| Quieres subir precios, cambiar el IVA o algo parecido | Los precios los cambias tú misma (sección 1: "Para cambiar un precio"). El tipo de IVA (21% ahora mismo) es un dato que solo cambiaría si cambia la ley española — si eso pasa alguna vez, pregunta a tu gestoría cuál es el nuevo tipo y pide ayuda técnica para actualizarlo en el código (no es algo que se edite desde Stripe). |

**Tu sesión de Stripe es la llave de la caja**: usa una contraseña fuerte, activa la verificación en dos pasos y no la compartas con nadie. La encuentras en el icono del engranaje (⚙️, arriba a la derecha) → **Configuración** → **Seguridad**: ahí verás un interruptor para activarla — sigue las instrucciones que te muestre Stripe en pantalla.

**Por si acaso te quedas sin acceso tú sola**: Stripe permite añadir más personas a tu cuenta con su propio usuario (⚙️ → **Configuración** → **Equipo**). Si confías en alguien (pareja, socio, un familiar), añadirlo como un segundo acceso evita que todo dependa de una sola contraseña o de un solo email.

## Si necesitas ayuda técnica de verdad y no puedes contactar con {contactoTecnico}

Para lo que sí requiere tocar código (la web se rompe de forma rara, hace falta un cambio nuevo), no dependes obligatoriamente de {contactoTecnico}: el código de {storeName} es público y libre (licencia AGPL-3.0), pensado exactamente para esto. Cualquier programador que sepa Next.js/React puede coger el repositorio, entenderlo (empieza por el fichero `CLAUDE.md`, que explica toda la tienda) y arreglar o cambiar lo que haga falta, sin depender de que una persona concreta siga disponible.
