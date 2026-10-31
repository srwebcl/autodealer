/**
 * Reseñas de Google Business de AutoDealer, entregadas por el cliente (copiadas del perfil).
 *
 * - Texto original, sin editar (incluye emojis y ortografía del autor).
 * - Excluidas: reseñas truncadas ("… Más"), sin texto, respuestas del propietario y
 *   reseñas con posible conflicto de interés (familiares del dueño / equipo de la web).
 * - El orden es el de presentación: las primeras se muestran de entrada.
 * - Calificación y total del perfil: null mientras el cliente no los entregue.
 */

export interface GoogleReview {
  /** Nombre tal como aparece en Google. */
  author: string;
  /** Texto original de la reseña. */
  text: string;
  /** Estrellas (1–5), solo si se conocen. */
  rating?: 1 | 2 | 3 | 4 | 5;
}

export const googleReviews: {
  profileUrl: string;
  rating: number | null;
  total: number | null;
  reviews: GoogleReview[];
} = {
  // Ficha de AutoDealer en Google Maps (CID del perfil de Google Business).
  profileUrl: "https://www.google.com/maps?cid=10896608766266616453",
  rating: null,
  total: null,
  reviews: [
    { author: "Rodrigo Condemarin", text: "Excelente atención en todo el proceso, se hicieron cargo de todo el papeleo y el pago fué tal como se acordó. Llevo 2 vehículos vendidos por Autodealer, un socio que da confianza," },
    { author: "Ruddy Perez", text: "Excelente atención desde el primer momento. Los vehículos están muy bien conservados y entregan una respuesta totalmente transparente sobre su estado. Da mucha confianza comprar así, totalmente recomendados.\"" },
    { author: "Sandro Carrasco", text: "Exelente atención de parte de Autodealer aunque finalmente no concrete la compra con ellos,se tomó el tiempo de asesorarme,recomendarme mecánicos de confianza y resolver todas mis dudas sin ningún compromiso.se nota el profesionalismo y buena voluntad.totalmente recomendado,da gusto encontrar gente así en el rubro automotriz." },
    { author: "Guillermo Valdivia", text: "Consigne una camioneta y me la vendieron y pagaron en menos de 24 horas, excelente servicio, totalmente recomendado." },
    { author: "Maria José Torres", text: "Excelente “Muy buena experiencia con esta automotora. Excelente atención, amabilidad y mucha transparencia durante todo el proceso. Los vehículos están en muy buenas condiciones y se nota la preocupación por ofrecer autos de calidad. Totalmente recomendable, quedamos muy conformes con la compra.”" },
    { author: "Felipe Tapia", text: "Llevo 2 autos comprados y se han portado un 7 👏🏿" },
    { author: "Nelson Rojas", text: "Este es el segundo vehículo que vendo con los hermanos Placencia y los recomiendo un 100%. Excelente atención, cumplen con los plazos establecidos y además están constantemente informando sobre el avance de la venta y sobre los posibles interesados. Los felicito" },
    { author: "Humberto Trigo", text: "Excelente atención con el cliente, personalizada, cordial, empática.\nMuy buena Relación precio calidad de los autos exhibidos.\nAltamente recomendada." },
    { author: "OSCAR ANGEL", text: "Carlos, su dueño, muy preocupado y atento con la información a medida que estaba mi automóvil en exhibición. Fue un proceso de pago rápido y seguro. Los recomiendo 100%. Ahora me ayuda en vender el segundo vehículo." },
    { author: "Constanza Seura", text: "Excelente experiencia con autodealer, son muy responsables los pagos son inmediatos y te ayudar agilizar todos los trámites, son muy preocupados con sus clientes, yo compré mi auto y vendí mi auto con ellos y ninguno problema, recomendadisimos" },
    { author: "Ariel Barraza", text: "Excelente atención, totalmente recomendable y trato directo con dueño de automotora. Muy atento en todas las dudas y consultas que se le realizan." },
    { author: "jean sui Betzabé Gajardo Angel", text: "Excelente servicio de la Automotora, era la primera vez que realizaba un proceso de venta a través de un intermediaro y quedamos muy conformes, excelente el trato de sus dueños, Confiable, buena comunicación durante el proceso de venta y el pago impecable. Recomendados al 100 % ." },
    { author: "Claudia Cortes", text: "Totalmente confiable y transparente muy bien 👍" },
    { author: "Flavio Maximiliano de jesus Barrancos Caruso", text: "Muy buena atención a la hora de atender, buenos vehículos, excelente ambiente, muy trasparente a la hora de una venta y otorga mucha confianza" },
    { author: "Jean Veliz", text: "Buena disposición al ofrecer un vehículo super" },
    { author: "Jorge Orrego", text: "Muy amable en su atención, cumple y ayuda a buscar el tipo de vehículo qué uno busca, precios al bolsillo y dan confianza 👍" },
    { author: "Jorge Molina", text: "Excelente atención y siempre muy buena disposición,,, puntualidad en los pagos" },
    { author: "Rocio", text: "Excelente servicio rápido y confiable .." },
    { author: "the players", text: "Una maravillosa automotora muy profesional sus trabajadores son amables y atentos con todos los clientes dan un muy buen servicio 1000% recomendado" },
    { author: "aless_ theking", text: "Excelente muy buen servicio y trato a sus clientes.\nVolvería una y mil veces\nMuy confiable" },
    { author: "Eduardo Hernández", text: "Excelente atención, gran disponibilidad del dueño para mostrar los vehículos, muy agradable" },
    { author: "Rodrigo Saavedra", text: "Excelente atención rápida y oportuna." },
    { author: "Hector Manuel Muñoz Hernandez", text: "Muy buena experiencia por la preocupación, responsabilidad y compromiso en todos los trámites que se efectúan con la automotora." },
    { author: "Rosario Medina Leyton", text: "Automotora responsable , buena atención, recomendable al 100,,," },
    { author: "Yanine MatJo", text: "Encontré el Autodealer una excelente atención y orientación. Muy responsables y atentos a resolver dudas. Sin dudas un muy buena opción. 100% recomendables." },
    { author: "Carla San Francisco", text: "200% recomendable está automotora,confiables y cálidos,autodealer lo mejors🫰" },
    { author: "Nicolas Bachelet", text: "Excelente experiencia, siempre atento con el cliente, siendo transparente y real con los pagos.\nMejor automotora, recomendada por la comodidad y preocupación siempre del cliente y las situaciones" },
    { author: "Cristian Ovalle", text: "Muy confiables , muy bien cuidados los vehículos muy buen trato a los clientes un servicio 10 de 10 excelentes vendedores 100 % confiables 👍👍👍" },
    { author: "Evelyn Tello", text: "Muy buena atención y gestión. Súper claros para hacer la transacción. Lo recomiendo." },
    { author: "Ronald Castro Meriño", text: "Automotora de confianza, fluidez y comprometidos con nosotros... Volvería a ojos cerrados a comprar acá." },
    { author: "constanza victoriano", text: "Muy buena atención, compraventa rápida y de confianza." },
    { author: "jose francisco javier tapia toro", text: "Muy buena atencion perzonalizada y y diponibilidad para responder todas las preguntas" },
    { author: "martin villalobos", text: "Muy bueno el servicio muy personalizado el vendedor a disposición para cualquier duda y lo recomiendo para poder comprar un automóvil 👌🏻" },
    { author: "christian rodas", text: "Muy buena experiencia, en cuanto a comunicación y venta del vehículo, pago fue mediato mismo día de la venta." },
    { author: "Jacqueline Campusano", text: "Estoy muy impresionada con la atención de Autodealer y su Dueño Carlos placencia y su equipo ,siempre amables y profesionales supero mis expectativas 100% Recomendable" },
    { author: "osvaldo aguilera", text: "Excelente gestión de venta, rapidez y eficiencia , cumple compromiso de pago pactado. Recomendado 100%" },
    { author: "Carolina Araya", text: "Excelente servicio" },
    { author: "Johny Rivera", text: "Excelente servicio, confiable y rápido. 100% recomendable. Vendí mi vehículo con autodealer muy rápido. Muchas gracias por todo" },
    { author: "Andrés rodriguez rojas", text: "Muy buen servicio rápido y eficiente, 100 % recomendado" },
    { author: "ruben leiva", text: "Automotora de confianza . Muy responsables y excelente atención. 100% recomendados. He consignado vehículos, y los pagos son rápidos y seguros. Siempre que uno tiene alguna duda o consulta te asesoran de excelente forma!" },
    { author: "Cecilia Carolina Cruz Rojas", text: "Excelente servicio !\nCumplen con lo que ofrecen en cuanto a tiempo , confianza , amabilidad y atención .\n100 % recomendados" },
    { author: "Sebastian Araya", text: "Excelente negocio....siempre atentos a mis solicitudes y requerimientos 👌" },
    { author: "Anton Munoz", text: "Excelente servicio y la venta fue rápida. Los recomiendo." },
    { author: "Victor Portus", text: "Sólo con conversar ya uno se da cuenta de un profesional Serio qué explica y recomienda con conocimientos y responsabilidad" },
    { author: "cesar antonio fernandez solis", text: "Excelente atención 😊 lo recomiendo al 💯💪" },
    { author: "Vicente GoGu", text: "Excelente atención, muy profesionales y transparentes, he vendido dos vehículos con ellos, el pago es rápido y confiable, 100% recomendado" },
    { author: "Nicolás Muñoz", text: "La mejor automotora de la región , atienden excelente . Les he comprado 2 vehículos y he tenido muy buena experiencia . Carlos el dueño es muy amable. Los recomiendo totalmente" },
    { author: "Alejandro Gamboa marmuth", text: "Excelente servicio desde que uno llega hasta que se va, variedad de vehículos para elegir y sobre todo con total claridad y transparencia al momento de saber del vehículo.. 100% recomiendo autodelear" },
    { author: "Michael Villegas", text: "Vendi mi auto y destaco la buena atencion a los clientes tambien los detalles como ofrecer hasta lo minimo un cafe, agua excelente servicio recomendable 100% venta y compra." },
    { author: "jaime oyarzo", text: "Hoy fui, me quedé muy conforme con la atención y las alternativas de venta de mi auto.\nMe da confianza" },
    { author: "Johans Bolados", text: "Destacar la buena atención, la transparencia y por sobretodo el profesionalismo en lo que fue la búsqueda y la compra de un vehículo.\nAgradecido y seguro que volvemos gracias!!!" },
    { author: "karen mprales", text: "Exelnte atención, claro ,responsable y atento ." },
    { author: "Lito Illanes", text: "Confiabilidad y cumplimiento con lo pactado, mucho éxito al equipo de automotor Autodealer." },
    { author: "constanza romero", text: "Muy buena atención los mejores de la serena" },
    { author: "Benjamin Díaz", text: "Exelente Servicio. Yo compré un vehículo y me salió súper bueno .\n\nDespués deje otro vehículo y lo mismo, súper buen servicio .Los recomiendo si quieren comprar auto o dejar en concesión , 5 estrellas los recomiendo. 👍" },
    { author: "Priscilla Pino", text: "Excelente atencion, vehiculos mas baratos lindos limpios que en otras automotoras, Carlos el dueño, muy buen trato y amabilidad." },
    { author: "Victor Antonio Alarcon Rochil", text: "Excelente servicio" },
    { author: "Ailin Lorca", text: "Ellos me ayudaron a elegir un auto maravilloso, super preocupados por los clientes que estén satisfechos, super recomendada una compra con ellos👌🏻" },
    { author: "Andres Borlando", text: "Muy buena la atencion y gestion" },
  ],
};
