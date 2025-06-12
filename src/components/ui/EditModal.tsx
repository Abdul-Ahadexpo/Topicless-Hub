import React, { useState } from 'react';
import { X, Save } from 'lucide-react';

interface EditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  title: string;
  initialData: any;
  type: 'question' | 'poll' | 'idea' | 'wyr';
}

const EditModal: React.FC<EditModalProps> = ({
  isOpen,
  onClose,
  onSave,
  title,
  initialData,
  type,
}) => {
  const [formData, setFormData] = useState(initialData);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  const renderFormFields = () => {
    switch (type) {
      case 'question':
        return (
          <div className="mb-4">
            <label htmlFor="text" className="label">
              Question
            </label>
            <textarea
              id="text"
              value={formData.text || ''}
              onChange={(e) => setFormData({ ...formData, text: e.target.value })}
              className="input h-24"
              required
            />
          </div>
        );

      case 'poll':
        return (
          <>
            <div className="mb-4">
              <label htmlFor="question" className="label">
                Poll Question
              </label>
              <input
                id="question"
                type="text"
                value={formData.question || ''}
                onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                className="input"
                required
              />
            </div>
            <div className="mb-4">
              <label className="label">Options</label>
              {formData.options?.map((option: any, index: number) => (
                <input
                  key={option.id}
                  type="text"
                  value={option.text}
                  onChange={(e) => {
                    const newOptions = [...formData.options];
                    newOptions[index] = { ...option, text: e.target.value };
                    setFormData({ ...formData, options: newOptions });
                  }}
                  className="input mb-2"
                  placeholder={`Option ${index + 1}`}
                  required
                />
              ))}
            </div>
            <div className="mb-4">
              <label htmlFor="gifUrl" className="label">
                GIF URL (optional)
              </label>
              <input
                id="gifUrl"
                type="url"
                value={formData.gifUrl || ''}
                onChange={(e) => setFormData({ ...formData, gifUrl: e.target.value })}
                className="input"
                placeholder="https://example.com/gif.gif"
              />
            </div>
          </>
        );

      case 'idea':
        return (
          <div className="mb-4">
            <label htmlFor="text" className="label">
              Idea
            </label>
            <textarea
              id="text"
              value={formData.text || ''}
              onChange={(e) => setFormData({ ...formData, text: e.target.value })}
              className="input h-24"
              required
            />
          </div>
        );

      case 'wyr':
        return (
          <>
            <div className="mb-4">
              <label htmlFor="optionA" className="label">
                Option A
              </label>
              <input
                id="optionA"
                type="text"
                value={formData.optionA || ''}
                onChange={(e) => setFormData({ ...formData, optionA: e.target.value })}
                className="input"
                required
              />
            </div>
            <div className="mb-4">
              <label htmlFor="optionB" className="label">
                Option B
              </label>
              <input
                id="optionB"
                type="text"
                value={formData.optionB || ''}
                onChange={(e) => setFormData({ ...formData, optionB: e.target.value })}
                className="input"
                required
              />
            </div>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {renderFormFields()}
          
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-outline"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary flex items-center"
            >
              <Save size={16} className="mr-2" />
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditModal;