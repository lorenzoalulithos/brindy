import type { Loc } from '../../core/i18n'
import { loc5, type PackId, type T5 } from '../../core/kit'
import { NEVER_COUPLES, NEVER_OFFICE } from './packs'

export type NeverCat = 'travel' | 'fails' | 'work' | 'life' | 'spicy' | 'couples' | 'office'

export interface NeverPrompt {
  text: Loc
  cat: NeverCat
  spicy?: true
  /** Premium pack the card belongs to (never shown in "all"). */
  pack?: PackId
}

/*
 * Every line completes the card header:
 * it "Non ho mai…" · en "Never have I ever…" · es "Yo nunca…" · fr "Je n'ai jamais…" · de "Ich hab noch nie…"
 * so: it/fr only "avere"/"avoir" verbs, de only "haben" verbs and no reflexives, es starts with "he"/"me he".
 */

const TRAVEL: T5[] = [
  ['perso un volo', 'missed a flight', 'he perdido un vuelo', 'raté un avion', 'einen Flug verpasst'],
  ['dormito in aeroporto', 'slept in an airport', 'he dormido en un aeropuerto', 'dormi dans un aéroport', 'am Flughafen übernachtet'],
  ['fatto un viaggio in solitaria', 'travelled solo', 'he viajado por mi cuenta', 'voyagé en solo', 'eine Reise ganz allein gemacht'],
  ['preso il treno sbagliato', 'got on the wrong train', 'me he subido al tren equivocado', 'pris le mauvais train', 'den falschen Zug genommen'],
  ['dimenticato il passaporto a casa', 'forgotten my passport at home', 'me he dejado el pasaporte en casa', 'oublié mon passeport à la maison', 'meinen Pass zu Hause vergessen'],
  ['mangiato qualcosa senza sapere cosa fosse', 'eaten something without knowing what it was', 'he comido algo sin saber qué era', 'mangé un truc sans savoir ce que c’était', 'etwas gegessen, ohne zu wissen, was es war'],
  ['fatto un tatuaggio in vacanza', 'got a tattoo on holiday', 'me he hecho un tatuaje de vacaciones', 'fait un tatouage en vacances', 'im Urlaub ein Tattoo stechen lassen'],
  ['scattato più di 500 foto in un solo viaggio', 'taken over 500 photos on a single trip', 'he hecho más de 500 fotos en un solo viaje', 'pris plus de 500 photos en un seul voyage', 'auf einer einzigen Reise über 500 Fotos gemacht'],
  ['fatto amicizia con uno sconosciuto in aereo', 'made friends with a stranger on a plane', 'he hecho amistad con un desconocido en un avión', 'sympathisé avec un inconnu dans l’avion', 'im Flugzeug mit einem Fremden Freundschaft geschlossen'],
  ['fatto finta di non essere italiano all’estero', 'pretended not to speak English abroad', 'he fingido no hablar español en el extranjero', 'fait semblant de ne pas parler français à l’étranger', 'im Ausland so getan, als könnte ich kein Deutsch'],
  ['pagato il bagaglio extra perché la valigia pesava troppo', 'paid an excess baggage fee', 'he pagado por exceso de equipaje', 'payé un supplément bagage', 'Übergepäck bezahlt'],
  ['indossato tutti i vestiti a strati per non pagare il bagaglio', 'worn all my clothes in layers to dodge a baggage fee', 'me he puesto toda la ropa a capas para no facturar', 'enfilé tous mes vêtements les uns sur les autres pour éviter un supplément bagage', 'alle Klamotten übereinander angezogen, um kein Gepäck zu bezahlen'],
  ['perso la valigia', 'lost my luggage', 'he perdido la maleta', 'perdu ma valise', 'meinen Koffer verloren'],
  ['visitato più di dieci paesi', 'visited more than ten countries', 'he visitado más de diez países', 'visité plus de dix pays', 'mehr als zehn Länder besucht'],
  ['fatto un viaggio on the road senza meta', 'done a road trip with no plan at all', 'he hecho un viaje por carretera sin rumbo', 'fait un road trip sans destination', 'einen Roadtrip ohne Ziel gemacht'],
  ['dormito in tenda', 'slept in a tent', 'he dormido en una tienda de campaña', 'dormi sous une tente', 'im Zelt geschlafen'],
  ['preso una scottatura così forte da non riuscire a dormire', 'got so sunburnt I couldn’t sleep', 'me he quemado tanto al sol que no podía dormir', 'pris un coup de soleil si violent que je n’arrivais plus à dormir', 'so einen Sonnenbrand gehabt, dass ich nicht schlafen konnte'],
  ['usato il traduttore per ordinare al ristorante', 'used a translation app to order food', 'he usado el traductor para pedir en un restaurante', 'utilisé un traducteur pour commander au resto', 'eine Übersetzer-App benutzt, um im Restaurant zu bestellen'],
  ['cantato a squarciagola in macchina durante un viaggio lungo', 'sung at the top of my lungs on a long car ride', 'he cantado a grito pelado en un viaje largo en coche', 'chanté à tue-tête pendant un long trajet en voiture', 'auf einer langen Autofahrt lauthals mitgesungen'],
  ['litigato con qualcuno durante una vacanza', 'had a fight with someone on holiday', 'he discutido con alguien en unas vacaciones', 'eu une dispute en vacances', 'im Urlaub Streit gehabt'],
  ['comprato un souvenir orribile', 'bought a truly hideous souvenir', 'he comprado un souvenir horrible', 'acheté un souvenir affreux', 'ein richtig hässliches Souvenir gekauft'],
  ['prenotato un viaggio la sera prima di partire', 'booked a trip the night before leaving', 'he reservado un viaje la noche antes de salir', 'réservé un voyage la veille du départ', 'eine Reise am Abend vor der Abfahrt gebucht'],
  ['visto l’alba dopo una notte in bianco in vacanza', 'watched the sunrise after an all-nighter on holiday', 'he visto amanecer tras una noche sin dormir en vacaciones', 'vu le lever du soleil après une nuit blanche en vacances', 'im Urlaub nach einer durchgemachten Nacht den Sonnenaufgang gesehen'],
  ['perso il telefono in vacanza', 'lost my phone on holiday', 'he perdido el móvil de vacaciones', 'perdu mon téléphone en vacances', 'im Urlaub mein Handy verloren'],
  ['fatto una crociera', 'been on a cruise', 'he hecho un crucero', 'fait une croisière', 'eine Kreuzfahrt gemacht'],
  ['portato via un accappatoio dall’hotel', 'taken a bathrobe home from a hotel', 'me he llevado un albornoz de un hotel', 'piqué un peignoir dans un hôtel', 'einen Bademantel aus dem Hotel mitgehen lassen'],
]

const FAILS: T5[] = [
  ['salutato qualcuno che in realtà salutava un altro', 'waved back at someone who was waving at someone else', 'he saludado a alguien que en realidad saludaba a otro', 'fait coucou à quelqu’un qui saluait une autre personne', 'zurückgewinkt, obwohl jemand ganz anderes gemeint war'],
  ['mandato un messaggio alla persona sbagliata', 'sent a text to the wrong person', 'he mandado un mensaje a la persona equivocada', 'envoyé un message à la mauvaise personne', 'eine Nachricht an die falsche Person geschickt'],
  ['chiamato la prof "mamma"', 'called my teacher "mum"', 'he llamado "mamá" a una profesora', 'appelé ma prof « maman »', 'meine Lehrerin aus Versehen „Mama“ genannt'],
  ['spinto una porta con scritto "tirare"', 'pushed a door that clearly said "pull"', 'he empujado una puerta que ponía "tirar"', 'poussé une porte où c’était écrit « tirez »', 'an einer Tür gedrückt, auf der „Ziehen“ stand'],
  ['messo like a una foto vecchissima mentre stalkeravo qualcuno', 'accidentally liked an ancient photo while stalking someone', 'he dado like sin querer a una foto antiquísima mientras stalkeaba a alguien', 'liké par erreur une très vieille photo en stalkant quelqu’un', 'beim Stalken aus Versehen ein uraltes Foto geliked'],
  ['riso nel momento in cui proprio non si doveva', 'laughed at a moment I absolutely shouldn’t have', 'me he reído en el peor momento posible', 'eu un fou rire au pire moment possible', 'im unpassendsten Moment einen Lachanfall bekommen'],
  ['inciampato davanti a un sacco di gente', 'tripped in front of a crowd', 'me he tropezado delante de un montón de gente', 'trébuché devant plein de monde', 'vor vielen Leuten einen peinlichen Sturz hingelegt'],
  ['cantato ad alta voce con le cuffie senza accorgermene', 'sung out loud with headphones on without realising', 'he cantado en voz alta con los cascos puestos sin darme cuenta', 'chanté à voix haute avec mes écouteurs sans m’en rendre compte', 'mit Kopfhörern laut mitgesungen, ohne es zu merken'],
  ['chiamato qualcuno col nome sbagliato per mesi', 'called someone by the wrong name for months', 'he llamado a alguien por el nombre equivocado durante meses', 'appelé quelqu’un par le mauvais prénom pendant des mois', 'jemanden monatelang mit dem falschen Namen angesprochen'],
  ['fatto una videochiamata senza sapere che la camera era accesa', 'been on a video call without realising my camera was on', 'he estado en una videollamada sin saber que tenía la cámara encendida', 'fait une visio sans savoir que ma caméra était allumée', 'einen Videocall gemacht, ohne zu merken, dass meine Kamera an war'],
  ['passato un giorno intero con la zip dei pantaloni aperta', 'spent a whole day with my fly down', 'he ido todo el día con la bragueta abierta', 'passé une journée entière la braguette ouverte', 'einen ganzen Tag mit offenem Hosenstall verbracht'],
  ['mandato un vocale e pregato che non lo ascoltassero mai', 'sent a voice note and prayed they’d never listen to it', 'he mandado un audio rezando para que no lo escucharan', 'envoyé un vocal en priant pour qu’il ne soit jamais écouté', 'eine Sprachnachricht geschickt und gebetet, dass sie nie abgehört wird'],
  ['riso a una battuta che non avevo capito', 'laughed at a joke I didn’t get', 'me he reído de un chiste que no había entendido', 'ri à une blague que je n’avais pas comprise', 'über einen Witz gelacht, den ich nicht verstanden hab'],
  ['parlato male di qualcuno che era proprio dietro di me', 'trash-talked someone who was standing right behind me', 'he criticado a alguien que estaba justo detrás de mí', 'critiqué quelqu’un qui était juste derrière moi', 'über jemanden gelästert, der direkt hinter mir stand'],
  ['sbagliato bagno, uomini o donne', 'walked into the wrong bathroom', 'he entrado en el baño equivocado', 'ouvert la porte des mauvaises toilettes', 'die falsche Toilette erwischt'],
  ['risposto "anche a te" al cameriere che diceva "buon appetito"', 'said "you too" when a waiter said "enjoy your meal"', 'he dicho "igualmente" al camarero que me decía "que aproveche"', 'répondu « vous aussi » au serveur qui me disait « bon appétit »', '„Gleichfalls“ gesagt, als der Kellner „Guten Appetit“ wünschte'],
  ['abbracciato qualcuno che voleva solo darmi la mano', 'gone in for a hug when they just wanted a handshake', 'he ido a dar un abrazo cuando solo querían darme la mano', 'voulu faire la bise à quelqu’un qui me tendait la main', 'jemanden umarmen wollen, der mir nur die Hand geben wollte'],
  ['fatto cadere il telefono nel water', 'dropped my phone in the toilet', 'he tirado el móvil al váter sin querer', 'fait tomber mon téléphone dans les toilettes', 'mein Handy ins Klo fallen lassen'],
  ['risposto a una domanda che non era rivolta a me', 'answered a question that wasn’t meant for me', 'he contestado a una pregunta que no era para mí', 'répondu à une question qui ne m’était pas destinée', 'eine Frage beantwortet, die gar nicht an mich ging'],
  ['riscritto un messaggio cinque volte prima di mandarlo', 'rewritten a text five times before sending it', 'he reescrito un mensaje cinco veces antes de enviarlo', 'réécrit un message cinq fois avant de l’envoyer', 'eine Nachricht fünfmal umgeschrieben, bevor ich sie abgeschickt hab'],
  ['salutato qualcuno e poi fatto la stessa strada in silenzio', 'said goodbye to someone, then walked the same way in awkward silence', 'me he despedido de alguien y luego hemos ido en la misma dirección en silencio', 'dit au revoir à quelqu’un avant de faire le même chemin en silence', 'tschüss gesagt und dann peinlich schweigend denselben Weg gehabt'],
  ['portato la maglia al contrario per tutto il giorno', 'worn my shirt inside out all day', 'he llevado la camiseta del revés todo el día', 'porté mon t-shirt à l’envers toute la journée', 'einen ganzen Tag mein Shirt auf links getragen'],
  ['fatto finta di essere al telefono per evitare qualcuno', 'faked a phone call to avoid someone', 'he fingido una llamada para evitar a alguien', 'fait semblant d’être au téléphone pour éviter quelqu’un', 'ein Telefonat vorgetäuscht, um jemandem aus dem Weg zu gehen'],
  ['russato in un posto pubblico', 'snored in public', 'he roncado en un sitio público', 'ronflé dans un lieu public', 'in der Öffentlichkeit geschnarcht'],
  ['fatto gli auguri di compleanno nel giorno sbagliato', 'wished someone happy birthday on the wrong day', 'he felicitado un cumpleaños el día equivocado', 'souhaité un anniversaire le mauvais jour', 'jemandem am falschen Tag zum Geburtstag gratuliert'],
  ['detto "ti voglio bene" per sbaglio chiudendo una chiamata di lavoro', 'accidentally said "love you" at the end of a work call', 'he dicho "te quiero" sin querer al colgar una llamada de trabajo', 'dit « bisous » par réflexe en raccrochant avec un client', 'aus Versehen „Hab dich lieb“ am Ende eines Arbeitstelefonats gesagt'],
  ['mandato uno screenshot proprio alla persona dello screenshot', 'sent a screenshot to the very person in it', 'he mandado una captura justo a la persona que salía en ella', 'envoyé une capture d’écran à la personne qui était dessus', 'einen Screenshot genau an die Person geschickt, um die es ging'],
]

const WORK: T5[] = [
  ['copiato a un compito in classe', 'cheated on a test', 'he copiado en un examen', 'triché à un contrôle', 'bei einer Klassenarbeit geschummelt'],
  ['finto di stare male per non andare al lavoro', 'pulled a sickie', 'he fingido estar enfermo para no ir a trabajar', 'fait semblant d’être malade pour sécher le boulot', 'blaugemacht'],
  ['dormito durante una riunione', 'nodded off in a meeting', 'me he dormido en una reunión', 'piqué du nez en pleine réunion', 'in einem Meeting ein Nickerchen gemacht'],
  ['risposto "a tutti" a una mail che non dovevano leggere tutti', 'hit "reply all" on an email that was definitely not for everyone', 'he respondido a todos en un correo que no era para todos', 'cliqué sur « répondre à tous » alors qu’il ne fallait surtout pas', 'aus Versehen auf „Allen antworten“ geklickt'],
  ['parlato male del capo in una chat dove c’era anche il capo', 'complained about my boss in a chat my boss was in', 'he criticado a mi jefe en un chat donde estaba mi jefe', 'critiqué mon chef dans un groupe où il était', 'in einem Chat über meinen Chef gelästert, in dem er selbst war'],
  ['mosso il mouse per sembrare impegnato', 'wiggled my mouse so I’d look busy', 'he movido el ratón para parecer ocupado', 'bougé ma souris pour avoir l’air occupé', 'die Maus bewegt, damit ich beschäftigt aussehe'],
  ['nascosto una brutta pagella ai miei', 'hidden a bad report card from my parents', 'he escondido unas malas notas a mis padres', 'caché un mauvais bulletin à mes parents', 'meinen Eltern ein schlechtes Zeugnis verheimlicht'],
  ['falsificato la firma dei miei genitori', 'forged my parents’ signature', 'he falsificado la firma de mis padres', 'imité la signature de mes parents', 'die Unterschrift meiner Eltern gefälscht'],
  ['mentito a un colloquio di lavoro', 'lied in a job interview', 'he mentido en una entrevista de trabajo', 'menti en entretien d’embauche', 'im Vorstellungsgespräch gelogen'],
  ['mangiato il pranzo di un collega dal frigo dell’ufficio', 'eaten a colleague’s lunch from the office fridge', 'me he comido el táper de un compañero de la nevera', 'mangé le déjeuner d’un collègue dans le frigo du bureau', 'das Essen eines Kollegen aus dem Bürokühlschrank gegessen'],
  ['fatto una presentazione senza aver preparato niente', 'given a presentation I hadn’t prepared at all', 'he hecho una presentación sin haber preparado nada', 'fait une présentation sans avoir rien préparé', 'eine Präsentation komplett ohne Vorbereitung gehalten'],
  ['inventato una scusa per un ritardo al lavoro', 'made up an excuse for being late to work', 'me he inventado una excusa por llegar tarde al trabajo', 'inventé une excuse pour un retard au travail', 'eine Ausrede fürs Zuspätkommen erfunden'],
  ['pianto in bagno al lavoro', 'cried in the toilets at work', 'he llorado en el baño del trabajo', 'pleuré dans les toilettes au boulot', 'auf der Arbeit im Klo geweint'],
  ['avuto una cotta per un prof', 'had a crush on a teacher', 'me he pillado de un profe', 'craqué pour un prof', 'für eine Lehrkraft geschwärmt'],
  ['studiato tutta la notte prima di un esame', 'pulled an all-nighter before an exam', 'he estudiado toda la noche antes de un examen', 'révisé toute la nuit avant un exam', 'die Nacht vor einer Prüfung durchgelernt'],
  ['fatto i compiti di qualcun altro in cambio di qualcosa', 'done someone’s homework in exchange for something', 'he hecho los deberes de otro a cambio de algo', 'fait les devoirs de quelqu’un en échange de quelque chose', 'für eine Gegenleistung die Hausaufgaben von jemand anderem gemacht'],
  ['usato per sbaglio il soprannome segreto del capo davanti a lui', 'accidentally used my boss’s secret nickname to their face', 'he llamado a mi jefe por su mote secreto sin querer', 'appelé mon chef par son surnom secret devant lui', 'meinen Chef aus Versehen mit seinem heimlichen Spitznamen angesprochen'],
  ['mandato un CV con un errore enorme', 'sent off a CV with a huge typo', 'he enviado un currículum con una errata enorme', 'envoyé un CV avec une énorme faute', 'einen Lebenslauf mit einem riesigen Tippfehler verschickt'],
  ['preso una nota sul registro', 'been sent to the head’s office', 'he acabado en el despacho del director', 'été convoqué chez le proviseur', 'einen Verweis bekommen'],
  ['spacciato per mio un lavoro scritto da un’IA', 'passed off AI-written work as my own', 'he hecho pasar por mío un trabajo escrito por una IA', 'fait passer un texte écrit par une IA pour le mien', 'einen KI-Text als meinen eigenen ausgegeben'],
  ['mollato un lavoro dopo il primo giorno', 'quit a job after just one day', 'he dejado un trabajo después del primer día', 'quitté un job après une seule journée', 'einen Job nach dem ersten Tag hingeschmissen'],
]

const LIFE: T5[] = [
  ['pianto per una pubblicità', 'cried at an advert', 'he llorado con un anuncio', 'pleuré devant une pub', 'bei einem Werbespot geweint'],
  ['mangiato una pizza intera senza dividerla con nessuno', 'eaten a whole pizza by myself', 'me he comido una pizza entera sin compartir', 'mangé une pizza entière sans partager', 'eine ganze Pizza allein gegessen'],
  ['rimesso in frigo il cartone del latte vuoto', 'put an empty milk carton back in the fridge', 'he vuelto a meter un cartón de leche vacío en la nevera', 'remis une bouteille de lait vide au frigo', 'eine leere Milchpackung zurück in den Kühlschrank gestellt'],
  ['finito una serie intera in un weekend', 'binged a whole series in one weekend', 'me he visto una serie entera en un fin de semana', 'enchaîné une série entière en un week-end', 'eine ganze Serie an einem Wochenende durchgesuchtet'],
  ['finto di aver letto un libro', 'pretended to have read a book', 'he fingido haber leído un libro', 'fait semblant d’avoir lu un livre', 'so getan, als hätte ich ein Buch gelesen'],
  ['riciclato un regalo', 'regifted a present', 'he regalado algo que me habían regalado a mí', 'refourgué un cadeau qu’on m’avait offert', 'ein Geschenk weiterverschenkt'],
  ['stalkerato l’ex del mio partner', 'stalked my partner’s ex online', 'he stalkeado al ex de mi pareja', 'stalké l’ex de ma moitié', 'den Ex meines Partners online gestalkt'],
  ['mentito sulla mia età', 'lied about my age', 'he mentido sobre mi edad', 'menti sur mon âge', 'beim Alter geschummelt'],
  ['mangiato qualcosa caduto per terra', 'eaten food off the floor', 'me he comido algo que se había caído al suelo', 'mangé un truc tombé par terre', 'etwas vom Boden gegessen'],
  ['parlato ad alta voce tra me e me per strada', 'talked to myself out loud in the street', 'he hablado en voz alta por la calle sin estar al teléfono', 'parlé à voix haute dans la rue sans être au téléphone', 'auf der Straße laut Selbstgespräche geführt'],
  ['fatto un concerto completo sotto la doccia', 'performed a full concert in the shower', 'he dado un concierto entero en la ducha', 'donné un concert entier sous la douche', 'unter der Dusche ein ganzes Konzert gegeben'],
  ['cercato il mio nome su Google', 'googled myself', 'he buscado mi nombre en Google', 'tapé mon propre nom sur Google', 'meinen eigenen Namen gegoogelt'],
  ['usato la password Netflix di qualcun altro', 'used someone else’s Netflix password', 'he usado la cuenta de Netflix de otra persona', 'utilisé le compte Netflix de quelqu’un d’autre', 'das Netflix-Passwort von jemand anderem benutzt'],
  ['tenuto il muso a qualcuno per più di una settimana', 'given someone the silent treatment for over a week', 'le he hecho la ley del hielo a alguien más de una semana', 'boudé quelqu’un plus d’une semaine', 'jemanden über eine Woche lang angeschwiegen'],
  ['assaggiato i croccantini del cane o del gatto', 'tasted pet food', 'he probado comida para mascotas', 'goûté des croquettes pour animaux', 'Tierfutter probiert'],
  ['scritto una poesia d’amore', 'written a love poem', 'he escrito un poema de amor', 'écrit un poème d’amour', 'ein Liebesgedicht geschrieben'],
  ['vinto soldi al gratta e vinci', 'won money on a scratch card', 'he ganado dinero con un rasca y gana', 'gagné de l’argent à un jeu à gratter', 'beim Rubbellos Geld gewonnen'],
  ['fatto ghosting a qualcuno', 'ghosted someone', 'le he hecho ghosting a alguien', 'ghosté quelqu’un', 'jemanden geghostet'],
  ['tinto i capelli di un colore assurdo', 'dyed my hair a crazy colour', 'me he teñido el pelo de un color loquísimo', 'teint mes cheveux d’une couleur improbable', 'meine Haare in einer verrückten Farbe gefärbt'],
  ['curiosato nel telefono di qualcun altro', 'snooped through someone else’s phone', 'he cotilleado el móvil de otra persona', 'fouillé dans le téléphone de quelqu’un', 'heimlich im Handy von jemand anderem geschnüffelt'],
  ['perso le chiavi di casa più di tre volte in un anno', 'lost my keys more than three times in one year', 'he perdido las llaves más de tres veces en un año', 'perdu mes clés plus de trois fois en un an', 'meinen Schlüssel mehr als dreimal in einem Jahr verloren'],
  ['fatto una cosa solo per poterla postare sui social', 'done something just so I could post it', 'he hecho algo solo para subirlo a redes', 'fait un truc juste pour le poster sur les réseaux', 'etwas nur gemacht, um es posten zu können'],
]

const SPICY: T5[] = [
  ['fatto il bagno nudo', 'gone skinny dipping', 'me he bañado desnudo', 'fait un bain de minuit tout nu', 'beim Nacktbaden mitgemacht'],
  ['baciato qualcuno in questa stanza', 'kissed someone in this room', 'he besado a alguien de esta habitación', 'embrassé quelqu’un dans cette pièce', 'jemanden in diesem Raum geküsst'],
  ['mandato un messaggio piccante alla persona sbagliata', 'sent a flirty text to the wrong person', 'he mandado un mensaje subidito de tono a quien no era', 'envoyé un message coquin à la mauvaise personne', 'eine heiße Nachricht an die falsche Person geschickt'],
  ['avuto una cotta per il partner di un amico', 'had a crush on a friend’s partner', 'me he pillado de la pareja de un amigo', 'craqué pour la moitié d’un pote', 'für den Partner eines Freundes geschwärmt'],
  ['baciato due persone nella stessa sera', 'kissed two people on the same night', 'he besado a dos personas la misma noche', 'embrassé deux personnes le même soir', 'zwei Leute am selben Abend geküsst'],
  ['usato un’app di incontri', 'used a dating app', 'he usado una app de citas', 'utilisé une appli de rencontre', 'eine Dating-App benutzt'],
  ['baciato qualcuno senza sapere come si chiamava', 'kissed someone without knowing their name', 'he besado a alguien sin saber cómo se llamaba', 'embrassé quelqu’un sans connaître son prénom', 'jemanden geküsst, ohne seinen Namen zu kennen'],
  ['fatto la camminata della vergogna la mattina dopo', 'done the walk of shame', 'he hecho el paseíllo de la vergüenza a la mañana siguiente', 'fait la marche de la honte au petit matin', 'den Walk of Shame am Morgen danach hingelegt'],
  ['avuto un appuntamento al buio', 'been on a blind date', 'he tenido una cita a ciegas', 'eu un rencard à l’aveugle', 'ein Blind Date gehabt'],
  ['sognato qualcuno che è qui stasera', 'had a dream about someone here tonight', 'he soñado con alguien que está aquí esta noche', 'rêvé de quelqu’un qui est là ce soir', 'von jemandem geträumt, der heute Abend hier ist'],
  ['flirtato per farmi offrire qualcosa', 'flirted my way into a free drink', 'he ligado para que me invitaran a algo', 'dragué pour me faire offrir un verre', 'geflirtet, um was ausgegeben zu bekommen'],
  ['baciato un ex dopo esserci lasciati', 'kissed an ex after we broke up', 'he besado a un ex después de cortar', 'embrassé un ex après la rupture', 'mit einem Ex nach der Trennung rumgeknutscht'],
  ['scritto all’ex alle 3 di notte', 'texted an ex at 3am', 'le he escrito a mi ex a las 3 de la mañana', 'écrit à mon ex à 3 h du matin', 'meinem Ex um 3 Uhr nachts geschrieben'],
  ['fatto io la prima mossa', 'made the first move', 'he dado yo el primer paso', 'fait le premier pas', 'den ersten Schritt gemacht'],
  ['mentito su quante persone ho baciato', 'lied about how many people I’ve kissed', 'he mentido sobre a cuántas personas he besado', 'menti sur le nombre de personnes que j’ai embrassées', 'gelogen, wie viele Leute ich schon geküsst hab'],
  ['avuto una relazione segreta', 'had a secret relationship', 'he tenido una relación secreta', 'eu une relation secrète', 'eine heimliche Beziehung gehabt'],
  ['fatto un selfie "seducente" e poi l’ho cancellato subito', 'taken a "sexy" selfie and deleted it straight away', 'me he hecho un selfie "sexy" y lo he borrado al momento', 'pris un selfie « sexy » avant de le supprimer aussitôt', 'ein „sexy“ Selfie gemacht und sofort gelöscht'],
  ['flirtato con qualcuno solo per far ingelosire un altro', 'flirted with someone just to make someone else jealous', 'he ligado con alguien solo para dar celos a otra persona', 'dragué quelqu’un juste pour rendre une autre personne jalouse', 'mit jemandem geflirtet, nur um jemand anderen eifersüchtig zu machen'],
  ['avuto una storia con qualcuno molto più grande di me', 'dated someone a lot older than me', 'he salido con alguien mucho mayor que yo', 'eu une histoire avec quelqu’un de beaucoup plus âgé', 'mit jemandem was gehabt, der viel älter war'],
  ['dato un numero falso a qualcuno', 'given someone a fake number', 'he dado un número falso a alguien', 'donné un faux numéro à quelqu’un', 'jemandem eine falsche Nummer gegeben'],
  ['fatto finta di essere single', 'pretended to be single', 'he fingido estar soltero', 'fait semblant d’être célibataire', 'so getan, als wäre ich Single'],
  ['usato il vischio come scusa per baciare qualcuno', 'used mistletoe as an excuse to kiss someone', 'he usado el muérdago como excusa para besar a alguien', 'utilisé le gui comme excuse pour embrasser quelqu’un', 'den Mistelzweig als Ausrede benutzt, um jemanden zu küssen'],
  ['baciato qualcuno al gioco della bottiglia', 'kissed someone during spin the bottle', 'he besado a alguien jugando a la botella', 'embrassé quelqu’un au jeu de la bouteille', 'jemanden beim Flaschendrehen geküsst'],
  ['messo like a tutte le foto di qualcuno per farmi notare', 'liked all of someone’s photos to get noticed', 'he dado like a todas las fotos de alguien para que se fijara en mí', 'liké toutes les photos de quelqu’un pour me faire remarquer', 'alle Fotos von jemandem geliked, um aufzufallen'],
  ['avuto due appuntamenti nello stesso giorno', 'had two dates on the same day', 'he tenido dos citas el mismo día', 'eu deux rencards le même jour', 'zwei Dates am selben Tag gehabt'],
  ['chiamato un appuntamento col nome sbagliato', 'called a date by the wrong name', 'he llamado a mi cita por otro nombre', 'appelé mon rencard par le mauvais prénom', 'mein Date mit dem falschen Namen angesprochen'],
  ['avuto una cotta per qualcuno di questo gruppo', 'had a crush on someone in this group', 'me he pillado de alguien de este grupo', 'eu un crush sur quelqu’un de ce groupe', 'für jemanden aus dieser Runde geschwärmt'],
  ['limonato in pubblico al punto che la gente guardava altrove', 'made out in public so much people had to look away', 'me he enrollado en público tanto que la gente apartaba la mirada', 'roulé des pelles en public au point que les gens détournaient le regard', 'in der Öffentlichkeit so wild geknutscht, dass andere weggeschaut haben'],
  ['ricevuto un messaggio piccante nel momento peggiore', 'got a cheeky text at the worst possible moment', 'he recibido un mensaje picante en el peor momento', 'reçu un message coquin au pire moment', 'eine heiße Nachricht im unpassendsten Moment bekommen'],
  ['flirtato con chi stava dietro al bancone', 'flirted with a bartender', 'he ligado con alguien de detrás de la barra', 'dragué la personne derrière le bar', 'mit jemandem hinter der Bar geflirtet'],
  ['lasciato qualcuno con un messaggio', 'dumped someone by text', 'he dejado a alguien por mensaje', 'largué quelqu’un par texto', 'per Nachricht Schluss gemacht'],
  ['baciato qualcuno al primo appuntamento', 'kissed someone on a first date', 'he besado a alguien en la primera cita', 'embrassé quelqu’un au premier rencard', 'beim ersten Date geküsst'],
  ['avuto un amore estivo', 'had a summer fling', 'he tenido un amor de verano', 'eu une amourette de vacances', 'eine Sommerliebe gehabt'],
  ['nascosto un succhiotto con la sciarpa', 'hidden a hickey with a scarf', 'he tapado un chupetón con una bufanda', 'caché un suçon avec une écharpe', 'einen Knutschfleck mit einem Schal versteckt'],
  ['scritto una dichiarazione d’amore senza mai mandarla', 'written a love confession and never sent it', 'he escrito una declaración de amor y nunca la he enviado', 'écrit une déclaration d’amour sans jamais l’envoyer', 'eine Liebeserklärung geschrieben und nie abgeschickt'],
  ['rifiutato un bacio', 'turned down a kiss', 'he rechazado un beso', 'refusé un baiser', 'einen Kuss abgelehnt'],
  ['baciato qualcuno per una scommessa', 'kissed someone on a dare', 'he besado a alguien por un reto', 'embrassé quelqu’un pour un pari', 'jemanden wegen einer Wette geküsst'],
  ['flirtato con qualcuno in questa stanza stasera', 'flirted with someone in this room tonight', 'he ligado con alguien de esta habitación esta noche', 'dragué quelqu’un dans cette pièce ce soir', 'heute Abend mit jemandem in diesem Raum geflirtet'],
  ['mentito al mio partner su dove fossi', 'lied to a partner about where I was', 'he mentido a mi pareja sobre dónde estaba', 'menti à ma moitié sur l’endroit où j’étais', 'meinen Partner angelogen, wo ich war'],
  ['controllato di nascosto il telefono del mio partner', 'secretly checked a partner’s phone', 'he mirado el móvil de mi pareja a escondidas', 'regardé le téléphone de ma moitié en cachette', 'heimlich das Handy meines Partners gecheckt'],
  ['fatto colazione a casa di qualcuno dopo un primo appuntamento', 'had breakfast at someone’s place after a first date', 'he desayunado en casa de alguien después de una primera cita', 'pris le petit-déj chez quelqu’un après un premier rencard', 'nach einem ersten Date bei jemandem gefrühstückt'],
  ['stalkerato una cotta fino alle foto delle vacanze del 2015', 'stalked a crush all the way back to their 2015 holiday photos', 'he stalkeado a un crush hasta sus fotos de vacaciones de 2015', 'stalké un crush jusqu’à ses photos de vacances de 2015', 'einen Crush bis zu den Urlaubsfotos von 2015 gestalkt'],
]

const tag = (list: T5[], cat: NeverCat): NeverPrompt[] =>
  list.map((t) => (cat === 'spicy' ? { text: loc5(t), cat, spicy: true } : cat === 'couples' || cat === 'office' ? { text: loc5(t), cat, pack: cat } : { text: loc5(t), cat }))

export const NEVER_PROMPTS: NeverPrompt[] = [
  ...tag(TRAVEL, 'travel'),
  ...tag(FAILS, 'fails'),
  ...tag(WORK, 'work'),
  ...tag(LIFE, 'life'),
  ...tag(SPICY, 'spicy'),
  ...tag(NEVER_COUPLES, 'couples'),
  ...tag(NEVER_OFFICE, 'office'),
]
