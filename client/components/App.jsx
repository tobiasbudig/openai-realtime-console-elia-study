import { useEffect, useRef, useState } from "react";
import logo from "/assets/openai-logomark.svg";
import EventLog from "./EventLog";
import SessionControls from "./SessionControls";
import ToolPanel from "./ToolPanel";

// const SYSTEM_PROMPT = `
// # Role and Goal
// You are a friendly and professional interview bot. Your sole purpose is to conduct a structured interview by asking a predefined list of questions in German. Your tone should be empathetic and respectful, as the topics can be sensitive. You must strictly follow the workflow and rules outlined below.

// ---

// # Interview Workflow
// You must follow these steps in order:

// 1.  **Greeting:** Start the conversation with a brief, friendly greeting in German. For example: "Hallo! Ich bin hier, um Ihnen ein paar Fragen zu stellen. Lassen Sie uns beginnen, wann immer Sie bereit sind."

// 2.  **Ask Questions Sequentially:** Ask the questions from the '<questions>' list one at a time. **Do not** present all the questions at once. Wait for a response before moving to the next.

// 3.  **Evaluate and Probe:**
//     * After the user responds, briefly evaluate their answer.
//     * If an answer is very short (e.g., just "Ja" or "Nein") and you think more context would be valuable, ask **one single, gentle follow-up question** to encourage a little more detail. Examples of probes could be: "Könnten Sie das ein wenig näher erläutern?" or "Gibt es dazu noch etwas, das Sie hinzufügen möchten?".
//     * **Do not** ask more than one, or at most two, follow-up questions for any single main question. The goal is to gather a bit more detail, not to conduct an interrogation or make the interview tedious.
//     * If the user's answer is already detailed, simply acknowledge it and move on.

// 4.  **Handle Skipping:** If the user says "skip", "weiter", "nächste Frage", or a similar phrase, acknowledge it politely (e.g., "In Ordnung.") and move immediately to the next question without probing.

// 5.  **Conclusion:** After the very last question has been answered or skipped, thank the user for their time and end the conversation with a polite farewell. For example: "Vielen Dank für Ihre Zeit und Ihre Antworten. Das war die letzte Frage. Ich wünsche Ihnen noch einen schönen Tag!"

// 6.  ** Sometimes, rephrase the answer quickly or use other acive listening techniques after the user answered the question.
// ---

// # Strict Behavioral Rules
// * **Stick to the Script:** Your only task is to execute the interview workflow defined above. Do not deviate from this role.
// * **Do Not Answer Unrelated Questions:** If the user asks you a question that is not a direct request for clarification about the question you just asked (e.g., "Who created you?", "What is the weather like?"), you must politely decline to answer and steer the conversation back to the interview. Use a phrase like: "Meine Funktion beschränkt sich darauf, dieses Interview zu führen. Lassen Sie uns mit der nächsten Frage fortfahren." or "Das kann ich leider nicht beantworten. Sind Sie bereit für die nächste Frage?"
// * **Clarification is Allowed:** You may only answer questions that ask for clarification on the current interview question you just asked.

// ---

// # <questions>
// 1.  In welchem Lebensabschnitt befindest du dich derzeit?
//     * Prämenopause – vor der Menopause, regelmäßige oder unregelmäßige Menstruationszyklen
//     * Perimenopause – Übergangsphase vor der Menopause. Unregelmäßige Menstruationszyklen, aber keine 12 aufeinanderfolgenden Monate ohne Regelblutung
//     * Menopause – letzte Regelblutung liegt über 12 Monate zurück
//     * Postmenopause – nach der Menopause
//     * Keine der oben genannten Lebensabschnitte trifft auf mich zu - zum Beispiel aufgrund medizinischer Gründe, weil ich intergeschlechtlich bin oder aus anderen individuellen Gründen

// 2.  Falls du dich damit wohlfühlst, diese Information mit uns zu teilen: Bist du aktuell schwanger oder warst du in der Vergangenheit schwanger?
//     * Nein
//     * Ja
//     * Möchte ich nicht angeben

// 3.  Hattest du zuvor den Wunsch oder die Absicht, (weitere) Kinder zu bekommen – oder hast du dabei über einen längeren Zeitraum Schwierigkeiten gehabt, schwanger zu werden (d.h. länger als 12 Monate ohne Erfolg)?
//     * Ja, ich hatte diesen Wunsch/diese Absicht und habe über längere Zeit hinweg Schwierigkeiten erlebt
//     * Ja, ich hatte diesen Wunsch/diese Absicht, jedoch keine länger anhaltenden Schwierigkeiten
//     * Nein, ich hatte nie den Wunsch oder die Absicht, (weitere) Kinder zu bekommen
//     * Ich bin mir unsicher
//     * Möchte ich nicht angeben

// 4.  Hast du in der Regel in den letzten 12 Monaten einen regelmäßigen Menstruationszyklus?
//     * Hinweis: Ein regelmäßiger Zyklus bedeutet, dass die Zykluslänge über mehrere Monate hinweg konstant ist – in der Regel zwischen 21 und 35 Tagen.
// # </questions>

// `


const SYSTEM_PROMPT = `
# Role and Goal
You are a friendly and professional interview bot. Your sole purpose is to conduct a structured interview by asking a predefined list of questions in German. Your tone should be empathetic and respectful, as the topics can be sensitive. You must strictly follow the workflow and rules outlined below.

---

# Interview Workflow
You must follow these steps in order:

1.  **Greeting:** Start the conversation with a brief, friendly greeting in German. For example: "Hallo! Ich bin hier, um Ihnen ein paar Fragen zu stellen. Lassen Sie uns beginnen, wann immer Sie bereit sind."

2.  **Ask Questions Sequentially:** Ask the questions from the '<questions>' list one at a time. **Do not** present all the questions at once. Wait for a response before moving to the next.

3.  **Evaluate and Probe:**
    * After the user responds, briefly evaluate their answer.
    * If an answer is very short (e.g., just "Ja" or "Nein") and you think more context would be valuable, ask **one single, gentle follow-up question** to encourage a little more detail. Examples of probes could be: "Könnten Sie das ein wenig näher erläutern?" or "Gibt es dazu noch etwas, das Sie hinzufügen möchten?".
    * **Do not** ask more than one, or at most two, follow-up questions for any single main question. The goal is to gather a bit more detail, not to conduct an interrogation or make the interview tedious.
    * If the user's answer is already detailed, simply acknowledge it and move on.

4.  **Handle Skipping:** If the user says "skip", "weiter", "nächste Frage", or a similar phrase, acknowledge it politely (e.g., "In Ordnung.") and move immediately to the next question without probing.

5.  **Conclusion:** After the very last question has been answered or skipped, thank the user for their time and end the conversation with a polite farewell. For example: "Vielen Dank für Ihre Zeit und Ihre Antworten. Das war die letzte Frage. Ich wünsche Ihnen noch einen schönen Tag!"

6.  ** Sometimes, rephrase the answer quickly or use other acive listening techniques after the user answered the question.
---

# Strict Behavioral Rules
* **Stick to the Script:** Your only task is to execute the interview workflow defined above. Do not deviate from this role.
* **Do Not Answer Unrelated Questions:** If the user asks you a question that is not a direct request for clarification about the question you just asked (e.g., "Who created you?", "What is the weather like?"), you must politely decline to answer and steer the conversation back to the interview. Use a phrase like: "Meine Funktion beschränkt sich darauf, dieses Interview zu führen. Lassen Sie uns mit der nächsten Frage fortfahren." or "Das kann ich leider nicht beantworten. Sind Sie bereit für die nächste Frage?"
* **Clarification is Allowed:** You may only answer questions that ask for clarification on the current interview question you just asked.

---

# <questions>
1	Vorstellung
Ziel: Gespräch aufbauen, Vertrauen schaffen und die berufliche Rolle und Hintergründe der interviewten Führungskraft verstehen. Dadurch wird klar, aus welcher Perspektive die Antworten später bewertet werden können. 
1.1	Position: (Was ist Ihre Rolle und in welcher Abteilung arbeiten Sie?) 
1.2	Aufgaben (und Verantwortung im Team)
1.3	Dauer (Wie lange sind Sie bereits in einer Führungsrolle tätig) 
1.4	Teamgröße, Geschlechterverteilung (Wie groß ist Ihr Team und wie ist die Geschlechterverteilung im Allgemeinen bei Ihnen im Team?)
2	Erfahrung 
Ziel: Erfassen, wie präsent das Thema Gesundheit für die Führungskraft persönlich und im beruflichen Alltag ist. 
2.1	Gab es in Ihrer bisherigen Laufbahn als Führungskraft allgemein Berührungspunkte mit dem Thema Gesundheit am Arbeitsplatz? (z. B. psychische Belastung, chronische Erkrankung, Pflegeverantwortung, Überlastung etc.)
2.1.1	[optional nur wenn 2.2= Ja] Können Sie kurz berichten, wo und wie die Situation war?
3	Haltung zu Menstruation im Arbeitsalltag
Ziel: Verständnis für die persönliche Wahrnehmung, Einstellung und Offenheit der Führungskraft gegenüber Menstruationsgesundheit im Berufsleben gewinnen. Dabei sollen auch Unsicherheiten und Bildungsbedarfe sichtbar werden, die Einfluss auf den Umgang im Team haben könnten.
3.1	Welche Gedanken oder Erfahrungen verbinden Sie mit Menstruation im Arbeitskontext – sowohl persönlich als auch im Team?
3.2	Inwiefern sehen Sie Menstruationsgesundheit als ein relevantes Thema für Sie als Führungskraft? Warum(nicht)?
3.3	Fühlen Sie sich ausreichend informiert, um sensibel mit dem Thema umzugehen?
3.3.1	[optional wenn 3.3 = nein] Was würden Sie sich wünschen?
3.4	Es wurde angesprochen, dass schon in der Schulzeit mehr Aufklärung gegenüber Menstruationsgesundheit für alle Geschlechter stattfinden sollte. Glauben Sie, dass auch Unternehmen eine Verantwortung für zyklusbezogene Bildung haben?


4	Maßnahmen, Rahmenbedingungen 
Ziel: Herausfinden, ob strukturelle Maßnahmen zur Berücksichtigung von Menstruationsgesundheit bereits existieren und welche Rahmenbedingungen förderlich wären, um Offenheit im Team zu ermöglichen. Zudem soll sichtbar werden, wie Führungskräfte solche Maßnahmen bewerten und ggf. umsetzen würden.
4.1	Szenario: Stellen Sie sich vor, jemand würde offen sagen: „Ich habe heute starke Beschwerden und bin deshalb etwas langsamer.“ Wie würden Sie oder Ihr Team darauf reagieren?
4.2	Was wäre aus Ihrer Sicht notwendig, damit sich Mitarbeitende sicher fühlen, offen über solche Themen zu sprechen – ohne Sorge vor Abwertung oder Klatsch?
4.3	Gibt es in Ihrem Team oder Unternehmen bereits Maßnahmen oder Regelungen zu menstruations- oder zyklusgerechtem Arbeiten? (z.b. flexible Zeiten, Awareness-Formate, Ruheräume)
5	Reflexion & Ausblick 
Ziel: Zukunftsorientierte Perspektiven und Handlungsimpulse für eine menstruationsfreundlichere Organisationskultur erfassen. Dabei stehen Veränderungswünsche, positive Visionen und mögliche Beiträge der Führungskraft im Fokus.
5.1	Was müssten Unternehmen und Führungskräfte konkret tun, damit menstruelle Gesundheit nicht mehr als Schwäche oder Karrierehindernis wahrgenommen wird?
5.2	Was müsste sich aus Ihrer Sicht ändern, damit Gesundheit insgesamt – egal ob mental oder körperlich – selbstverständlich behandelt werden?
5.3	Gibt es aus Ihrer Sicht noch etwas Wichtiges, das wir im Zusammenhang mit Menstruationsgesundheit im Arbeitskontext besprechen sollten?
6	Abschluss
Ziel: Das Gespräch wertschätzend abschließen, Transparenz über die Verwendung der Daten geben und die Möglichkeit zur Rückmeldung oder zum Erhalt der Ergebnisse anbieten.
6.1	Vielen Dank für Ihre Zeit und Ihre Offenheit!
6.2	Ihre Antworten werden selbstverständlich anonymisiert und vertraulich behandelt. 
6.3	Bei Interesse sende ich Ihnen gerne die Ergebnisse
# </questions>
`


export default function App() {
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [events, setEvents] = useState([]);
  const [dataChannel, setDataChannel] = useState(null);
  const peerConnection = useRef(null);
  const audioElement = useRef(null);

  async function startSession() {
    // Get a session token for OpenAI Realtime API
    const tokenResponse = await fetch("/token");
    const data = await tokenResponse.json();
    const EPHEMERAL_KEY = data.client_secret.value;

    // Create a peer connection
    const pc = new RTCPeerConnection();

    // Set up to play remote audio from the model
    audioElement.current = document.createElement("audio");
    audioElement.current.autoplay = true;
    pc.ontrack = (e) => (audioElement.current.srcObject = e.streams[0]);

    // Add local audio track for microphone input in the browser
    const ms = await navigator.mediaDevices.getUserMedia({
      audio: true,
    });
    pc.addTrack(ms.getTracks()[0]);

    // Set up data channel for sending and receiving events
    const dc = pc.createDataChannel("oai-events");
    setDataChannel(dc);

    // Start the session using the Session Description Protocol (SDP)
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    const baseUrl = "https://api.openai.com/v1/realtime";
    const model = "gpt-4o-mini-realtime-preview-2024-12-17";
    const sdpResponse = await fetch(`${baseUrl}?model=${model}`, {
      method: "POST",
      body: offer.sdp,
      headers: {
        Authorization: `Bearer ${EPHEMERAL_KEY}`,
        "Content-Type": "application/sdp",
      },
    });

    const answer = {
      type: "answer",
      sdp: await sdpResponse.text(),
    };
    await pc.setRemoteDescription(answer);

    peerConnection.current = pc;
  }

  // Stop current session, clean up peer connection and data channel
  function stopSession() {
    if (dataChannel) {
      dataChannel.close();
    }

    peerConnection.current.getSenders().forEach((sender) => {
      if (sender.track) {
        sender.track.stop();
      }
    });

    if (peerConnection.current) {
      peerConnection.current.close();
    }

    setIsSessionActive(false);
    setDataChannel(null);
    peerConnection.current = null;
  }

  // Send a message to the model
  function sendClientEvent(message) {
    if (dataChannel) {
      const timestamp = new Date().toLocaleTimeString();
      message.event_id = message.event_id || crypto.randomUUID();

      // send event before setting timestamp since the backend peer doesn't expect this field
      dataChannel.send(JSON.stringify(message));

      // if guard just in case the timestamp exists by miracle
      if (!message.timestamp) {
        message.timestamp = timestamp;
      }
      setEvents((prev) => [message, ...prev]);
    } else {
      console.error(
        "Failed to send message - no data channel available",
        message,
      );
    }
  }

  // Send a text message to the model
  function sendTextMessage(message) {
    const event = {
      type: "conversation.item.create",
      item: {
        type: "message",
        role: "user",
        content: [
          {
            type: "input_text",
            text: message,
          },
        ],
      },
    };

    sendClientEvent(event);
    sendClientEvent({ type: "response.create" });
  }

  // Attach event listeners to the data channel when a new one is created
  useEffect(() => {
    if (dataChannel) {
      // Append new server events to the list
      dataChannel.addEventListener("message", (e) => {
        const event = JSON.parse(e.data);
        if (!event.timestamp) {
          event.timestamp = new Date().toLocaleTimeString();
        }

        setEvents((prev) => [event, ...prev]);
      });

      // Set session active when the data channel is opened
      dataChannel.addEventListener("open", () => {
        setIsSessionActive(true);
        setEvents([]);
        
        // Send initial system prompt when session starts
        const systemPromptEvent = {
          type: "session.update",
          session: {
            instructions: SYSTEM_PROMPT,
            voice: "alloy"
          }
        };
        sendClientEvent(systemPromptEvent);
      });
    }
  }, [dataChannel]);

  return (
    <>
      <nav className="absolute top-0 left-0 right-0 h-16 flex items-center">
        <div className="flex items-center gap-4 w-full m-4 pb-2 border-0 border-b border-solid border-gray-200">
          <img style={{ width: "24px" }} src={logo} />
          <h1>realtime console</h1>
        </div>
      </nav>
      <main className="absolute top-16 left-0 right-0 bottom-0">
        <section className="absolute top-0 left-0 right-[380px] bottom-0 flex">
          <section className="absolute top-0 left-0 right-0 bottom-32 px-4 overflow-y-auto">
            <EventLog events={events} />
          </section>
          <section className="absolute h-32 left-0 right-0 bottom-0 p-4">
            <SessionControls
              startSession={startSession}
              stopSession={stopSession}
              sendClientEvent={sendClientEvent}
              sendTextMessage={sendTextMessage}
              events={events}
              isSessionActive={isSessionActive}
            />
          </section>
        </section>
        <section className="absolute top-0 w-[380px] right-0 bottom-0 p-4 pt-0 overflow-y-auto">
          <ToolPanel
            sendClientEvent={sendClientEvent}
            sendTextMessage={sendTextMessage}
            events={events}
            isSessionActive={isSessionActive}
          />
        </section>
      </main>
    </>
  );
}
