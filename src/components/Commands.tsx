"use client";

import { COMMANDS, CATEGORIES } from "@/lib/commands";

interface CommandsProps {
  onCommandClick: (url: string) => void;
}

export default function Commands({ onCommandClick }: CommandsProps) {
  const commandsByCategory = Object.entries(CATEGORIES).map(
    ([key, category]) => ({
      ...category,
      key,
      commands: COMMANDS.filter((cmd) => cmd.category === key),
    })
  );

  return (
    <div className="flex flex-col gap-5">
      {commandsByCategory.map((category) => (
        <div key={category.key}>
          <div className="category-label">{category.name}</div>
          <div className="pills-row">
            {category.commands.map((command) => (
              <button
                key={command.id}
                className={`link-pill ${command.featured ? "link-pill-featured" : ""}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onCommandClick(command.url);
                }}
              >
                {command.name}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
