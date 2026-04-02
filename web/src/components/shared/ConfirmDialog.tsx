interface ConfirmDialogProps {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
  confirmLabel?: string;
  variant?: 'danger' | 'default';
}

export default function ConfirmDialog({
  message,
  onConfirm,
  onCancel,
  loading = false,
  confirmLabel = 'Conferma',
  variant = 'default',
}: ConfirmDialogProps) {
  const wrapperClass =
    variant === 'danger'
      ? 'bg-red-50 border border-red-100 rounded-xl p-3'
      : 'bg-gray-50 border border-gray-200 rounded-xl p-3';

  const confirmClass = variant === 'danger' ? 'btn-danger' : 'btn-primary';

  return (
    <div className={wrapperClass}>
      <p className="text-sm text-gray-700 mb-3 leading-snug">{message}</p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="btn-secondary text-xs px-3 py-1.5"
        >
          Annulla
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={loading}
          className={`${confirmClass} text-xs px-3 py-1.5 min-w-[5rem]`}
        >
          {loading ? (
            <span className="flex items-center gap-1.5">
              <svg
                className="animate-spin w-3.5 h-3.5 shrink-0"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                />
              </svg>
              Attendere...
            </span>
          ) : (
            confirmLabel
          )}
        </button>
      </div>
    </div>
  );
}
