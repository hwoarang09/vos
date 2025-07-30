// components/TopicDropdown.tsx
import React from "react";

interface TopicDropdownProps {
  topics: { topic: string }[];
  selectedTopic: string;
  onSelectTopic: (topic: string) => void;
}

const TopicDropdown: React.FC<TopicDropdownProps> = ({
  topics,
  selectedTopic,
  onSelectTopic,
}) => {
  return (
    <select
      value={selectedTopic}
      onChange={(e) => onSelectTopic(e.target.value)}
      className="border p-2 rounded w-full mb-2"
    >
      <option value="">Select a topic</option>
      {topics.map((t) => (
        <option key={t.topic} value={t.topic}>
          {t.topic}
        </option>
      ))}
    </select>
  );
};

export default TopicDropdown;
