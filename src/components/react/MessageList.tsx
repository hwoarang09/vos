import React from "react";
import { useMqttStore } from "../../store/mqttStore";

const MessageList = () => {
  const { receivedMessages } = useMqttStore();

  console.log(receivedMessages);
  console.log(Object.keys(receivedMessages));
  return (
    <div className="bg-white/80 p-4 rounded shadow-md flex-grow">
      <h2 className="text-lg font-semibold">Received Messages</h2>
      <div className="overflow-y-auto max-h-40">
        {Object.keys(receivedMessages).map((topic) => (
          <div key={topic} className="mb-4">
            <h3 className="font-semibold">{topic}</h3>
            <ul>
              {receivedMessages[topic].map((message, index) => (
                <li key={index}>{JSON.stringify(message)}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MessageList;
