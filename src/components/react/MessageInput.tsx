// components/DynamicMessageInput.tsx
import React from "react";

interface MessageInputProps {
  keyList: { [key: string]: string };
  messageData: { [key: string]: any };
  onChangeMessageData: (key: string, value: any) => void;
}

const MessageInput: React.FC<MessageInputProps> = ({
  keyList,
  messageData,
  onChangeMessageData,
}) => {
  return (
    <div>
      {Object.entries(keyList).map(([key, type]) => (
        <div key={key} className="mb-2">
          <label className="block text-gray-700">{key}</label>
          {type === "string" ? (
            <input
              type="text"
              value={messageData[key] || ""}
              onChange={(e) => onChangeMessageData(key, e.target.value)}
              className="border p-2 rounded w-full"
            />
          ) : type === "array" ? (
            <textarea
              value={(messageData[key] || []).join(",")}
              onChange={(e) =>
                onChangeMessageData(
                  key,
                  e.target.value.split(",").map((item) => item.trim())
                )
              }
              className="border p-2 rounded w-full h-24 resize-none"
              placeholder="Enter comma-separated values"
            />
          ) : null}
        </div>
      ))}
    </div>
  );
};

export default MessageInput;
