import * as React from "react";
import * as ReactDOM from "react-dom/client";
import "./ui.css";
import { DEFAULT_OPTIONS, PasteOptions } from "./types";

type BooleanOptionKey = 'ignoreEmpty' | 'trimLines' | 'reverse' | 'shuffle' | 'loop' | 'sortByPosition';

const TOGGLES: { key: BooleanOptionKey; label: string }[] = [
  { key: 'loop', label: 'Loop through list' },
  { key: 'ignoreEmpty', label: 'Ignore empty lines' },
  { key: 'trimLines', label: 'Trim whitespace' },
  { key: 'reverse', label: 'Reverse order' },
  { key: 'shuffle', label: 'Shuffle order' },
  { key: 'sortByPosition', label: 'Sort by position' },
];

const SEPARATORS: { value: PasteOptions['separator']; label: string }[] = [
  { value: 'newline', label: 'Line' },
  { value: 'comma', label: 'Comma' },
  { value: 'custom', label: 'Custom' },
];

function Toggle(props: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="flex cursor-pointer select-none items-center justify-between gap-2 py-1.5 text-xs text-neutral-700 dark:text-neutral-300">
      {props.label}
      <span className="relative inline-flex shrink-0">
        <input
          type="checkbox"
          className="peer sr-only"
          checked={props.checked}
          onChange={event => props.onChange(event.target.checked)}
        />
        <span className="h-4 w-7 rounded-full bg-neutral-300 transition-colors peer-checked:bg-blue-600 peer-focus-visible:ring-2 peer-focus-visible:ring-blue-500/50 dark:bg-neutral-600 dark:peer-checked:bg-blue-500" />
        <span className="pointer-events-none absolute left-0.5 top-0.5 size-3 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-3" />
      </span>
    </label>
  );
}

function SectionTitle(props: { children: React.ReactNode }) {
  return (
    <h2 className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
      {props.children}
    </h2>
  );
}

function App() {
  const [text, setText] = React.useState("");
  const [options, setOptions] = React.useState<PasteOptions>(DEFAULT_OPTIONS);
  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => {
    const handler = (event: MessageEvent) => {
      const msg = event.data && event.data.pluginMessage;
      if (!msg) return;
      if (msg.type === 'init') {
        setOptions(msg.options);
        setHydrated(true);
      } else if (msg.type === 'copyFromSelection') {
        setText(msg.text);
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  // Persist options whenever they change — but never before the stored
  // values have arrived, or we'd overwrite them with defaults on mount.
  React.useEffect(() => {
    if (!hydrated) return;
    parent.postMessage({ pluginMessage: { type: 'save-options', options } }, '*');
  }, [options, hydrated]);

  const setOption = <K extends keyof PasteOptions>(key: K, value: PasteOptions[K]) => {
    setOptions(prev => ({ ...prev, [key]: value }));
  };

  const onPaste = () => {
    parent.postMessage({ pluginMessage: { type: 'paste', text, options } }, '*');
  };

  const onCopy = () => {
    parent.postMessage({ pluginMessage: { type: 'copy', options } }, '*');
  };

  // Mirrors the split/trim/filter the plugin applies, so the count previews
  // what Paste will actually distribute.
  const separatorChar = options.separator === 'comma' ? ','
    : options.separator === 'custom' ? (options.customSeparator || '\n')
    : '\n';
  let items = text.split(separatorChar);
  if (options.trimLines) items = items.map(line => line.trim());
  if (options.ignoreEmpty) items = items.filter(line => line.length > 0);
  const count = text.length === 0 ? 0 : items.length;

  return (
    <main className="flex h-full">
      <section className="flex min-w-0 flex-1 flex-col">
        <textarea
          id="text"
          className="w-full flex-1 resize-none bg-transparent p-4 text-[13px] leading-relaxed text-neutral-800 outline-none placeholder:text-neutral-400 dark:text-neutral-200 dark:placeholder:text-neutral-600"
          placeholder="Type or paste your list here…"
          value={text}
          onChange={event => setText(event.target.value)}
        />
        <div className="border-t border-neutral-200 px-4 py-2 text-[11px] text-neutral-400 dark:border-neutral-800 dark:text-neutral-500">
          {count} {count === 1 ? 'item' : 'items'}
        </div>
      </section>

      <aside className="flex w-[200px] shrink-0 flex-col gap-5 overflow-y-auto border-l border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-800/40">
        <div>
          <SectionTitle>Options</SectionTitle>
          <div className="flex flex-col">
            {TOGGLES.map(({ key, label }) => (
              <Toggle key={key} label={label} checked={options[key]} onChange={value => setOption(key, value)} />
            ))}
          </div>
        </div>

        <div>
          <SectionTitle>Separator</SectionTitle>
          <div className="mt-1 flex rounded-lg bg-neutral-200/70 p-0.5 dark:bg-neutral-700/60">
            {SEPARATORS.map(({ value, label }) => (
              <button
                key={value}
                className={
                  options.separator === value
                    ? 'flex-1 cursor-pointer rounded-md bg-white py-1 text-[11px] font-medium text-neutral-800 shadow-sm dark:bg-neutral-600 dark:text-white'
                    : 'flex-1 cursor-pointer rounded-md py-1 text-[11px] text-neutral-500 transition-colors hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200'
                }
                onClick={() => setOption('separator', value)}
              >
                {label}
              </button>
            ))}
          </div>
          {options.separator === 'custom' && (
            <input
              className="mt-2 w-full rounded-md border border-neutral-300 bg-white px-2 py-1.5 text-xs text-neutral-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/40 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200"
              value={options.customSeparator}
              onChange={event => setOption('customSeparator', event.target.value)}
              placeholder="e.g. |"
            />
          )}
        </div>

        <div className="mt-auto flex flex-col gap-2">
          <button
            id="copy"
            className="cursor-pointer rounded-lg border border-neutral-300 py-2 text-xs font-medium text-neutral-700 transition-colors hover:bg-neutral-200/60 dark:border-neutral-600 dark:text-neutral-200 dark:hover:bg-neutral-700/50"
            onClick={onCopy}
          >
            Copy from selection
          </button>
          <button
            id="create"
            className="cursor-pointer rounded-lg bg-blue-600 py-2 text-xs font-medium text-white transition-colors hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400"
            onClick={onPaste}
          >
            Paste
          </button>
        </div>
      </aside>
    </main>
  );
}

ReactDOM.createRoot(document.getElementById("react-page")).render(<App />);
