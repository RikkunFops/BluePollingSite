import { useState } from "react"
import { effectRegistry, effectRegRegistry } from "~/routes/types/status"
import type { statusConstructor } from "~/routes/types/status";
import BaseStatus from "~/routes/types/baseStatus";
import { number } from "zod";
import { Hypnosis } from "~/routes/types/Statuses/hypno";


export interface StatusSelectorProps {
    value: BaseStatus[];
    onChange: (statuses: BaseStatus[]) => void;
}

export default function StatusSelector({
    value,
    onChange,
}: StatusSelectorProps) {
    console.log("Logging: " +effectRegRegistry);

    const addStatus = (statusClass: statusConstructor) => {
        if (value.length >= 4) return;

        // Don't allow duplicates
        if (value.some(s => s.constructor.name === statusClass.name))
            return;

        onChange([...value, new statusClass()]);
    };

    const removeStatus = (index: number) => {
        onChange(value.filter((_, i) => i !== index));
    };

    function updatePotency(index: number, potency : number) {
        const updated = [...value];

        if (updated[index] instanceof Hypnosis) {
            updated[index].potency = potency;
        }

        onChange(updated);
    }
    return (
        <>
            <select
                defaultValue=""
                onChange={(e) => {
                    if (!e.target.value) return;

                    addStatus(effectRegistry[e.target.value]);
                    e.target.value = "";
                }}
            >
                <option value="">Select a status...</option>

                {Object.entries(effectRegRegistry).map(([groupName, registry]) => (
                    <optgroup
                        key={groupName}
                        label={groupName}
                    >
                        {registry.map(Status => (
                            <option
                                key={Status.name}
                                value={Status.name}
                            >
                                {Status.name}
                                
                            </option>
                        ))}
                    </optgroup>
                ))}
            </select>

            {value.map((status, index) => (
            <div className="status-item" key={index}>
                <span className="status-name">
                    {status.constructor.name}
                </span>

                {status instanceof Hypnosis && (
                    <input
                        className="status-input"
                        type="number"
                        min={1}
                        max={5}
                        value={status.potency ?? 1}
                        autoComplete="off"
                        onChange={(e) => updatePotency(index, Number(e.target.value))}
                    />
                )}

                <button
                    className="remove-btn"
                    onClick={() => removeStatus(index)}
                >
                    Remove
                </button>
            </div>
        ))}
        </>
    );
}