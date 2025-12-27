import { useState } from 'react';
import { FiBookmark, FiPlus, FiTrash2, FiEdit3 } from 'react-icons/fi';
import { useTodo } from '../context/TodoContext';

const defaultTemplates = [
  {
    id: 'meeting-prep',
    name: 'Meeting Preparation',
    description: 'Standard meeting prep checklist',
    tasks: [
      { title: 'Review agenda', priority: 'high', estimatedTime: '15 minutes' },
      { title: 'Prepare talking points', priority: 'medium', estimatedTime: '30 minutes' },
      { title: 'Gather supporting documents', priority: 'medium', estimatedTime: '20 minutes' },
      { title: 'Test video/audio setup', priority: 'low', estimatedTime: '5 minutes' }
    ],
    category: 'Work',
    tags: ['meeting', 'preparation']
  },
  {
    id: 'project-launch',
    name: 'Project Launch',
    description: 'Complete project launch checklist',
    tasks: [
      { title: 'Final testing and QA', priority: 'high', estimatedTime: '2 hours' },
      { title: 'Update documentation', priority: 'medium', estimatedTime: '1 hour' },
      { title: 'Notify stakeholders', priority: 'high', estimatedTime: '30 minutes' },
      { title: 'Monitor initial metrics', priority: 'medium', estimatedTime: '45 minutes' }
    ],
    category: 'Work',
    tags: ['project', 'launch']
  },
  {
    id: 'weekly-review',
    name: 'Weekly Review',
    description: 'Personal productivity review',
    tasks: [
      { title: 'Review completed tasks', priority: 'medium', estimatedTime: '20 minutes' },
      { title: 'Plan next week priorities', priority: 'high', estimatedTime: '30 minutes' },
      { title: 'Update goals progress', priority: 'medium', estimatedTime: '15 minutes' },
      { title: 'Clean up workspace', priority: 'low', estimatedTime: '10 minutes' }
    ],
    category: 'Personal',
    tags: ['review', 'planning']
  }
];

export default function TaskTemplates({ onClose, onCreateTasks }) {
  const { state } = useTodo();
  const [templates, setTemplates] = useState(() => {
    const saved = localStorage.getItem('task-templates');
    return saved ? JSON.parse(saved) : defaultTemplates;
  });
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [editingTemplate, setEditingTemplate] = useState(null);

  const saveTemplates = (newTemplates) => {
    setTemplates(newTemplates);
    localStorage.setItem('task-templates', JSON.stringify(newTemplates));
  };

  const useTemplate = (template) => {
    const baseDueDate = new Date();
    baseDueDate.setHours(baseDueDate.getHours() + 2); // Start 2 hours from now

    const tasks = template.tasks.map((task, index) => ({
      ...task,
      description: `From template: ${template.name}`,
      categories: template.category ? [template.category] : [],
      dueDate: new Date(baseDueDate.getTime() + (index * 60 * 60 * 1000)).toISOString().slice(0, 16) // 1 hour apart
    }));

    onCreateTasks(tasks);
    onClose();
  };

  const deleteTemplate = (templateId) => {
    const newTemplates = templates.filter(t => t.id !== templateId);
    saveTemplates(newTemplates);
  };

  const createCustomTemplate = () => {
    const newTemplate = {
      id: `custom-${Date.now()}`,
      name: 'Custom Template',
      description: 'New custom template',
      tasks: [
        { title: 'New task', priority: 'medium', estimatedTime: '30 minutes' }
      ],
      category: 'Work',
      tags: ['custom']
    };
    setEditingTemplate(newTemplate);
  };

  const saveCustomTemplate = (template) => {
    const newTemplates = templates.some(t => t.id === template.id)
      ? templates.map(t => t.id === template.id ? template : t)
      : [...templates, template];
    saveTemplates(newTemplates);
    setEditingTemplate(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="w-full max-w-4xl bg-[var(--bg-primary)] rounded-xl shadow-2xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-[var(--border-color)]">
          <h2 className="text-lg font-semibold">Task Templates</h2>
          <div className="flex gap-2">
            <button onClick={createCustomTemplate}
              className="px-3 py-1.5 bg-[var(--accent)] text-white rounded-lg text-sm hover:opacity-90">
              <FiPlus size={14} className="inline mr-1" /> Create Template
            </button>
            <button onClick={onClose} className="p-1 rounded hover:bg-[var(--bg-secondary)]">
              ✕
            </button>
          </div>
        </div>

        <div className="p-4 overflow-y-auto max-h-[calc(90vh-80px)]">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map(template => (
              <div key={template.id} className="bg-[var(--bg-secondary)] rounded-lg p-4 border border-[var(--border-color)]">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-medium">{template.name}</h3>
                    <p className="text-sm text-[var(--text-secondary)] mt-1">{template.description}</p>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => setEditingTemplate(template)}
                      className="p-1 hover:bg-[var(--bg-tertiary)] rounded">
                      <FiEdit3 size={14} />
                    </button>
                    {!defaultTemplates.some(t => t.id === template.id) && (
                      <button onClick={() => deleteTemplate(template.id)}
                        className="p-1 hover:bg-red-500/10 text-red-500 rounded">
                        <FiTrash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  {template.tasks.slice(0, 3).map((task, i) => (
                    <div key={i} className="text-sm p-2 bg-[var(--bg-primary)] rounded border-l-4 border-[var(--accent)]">
                      <div className="font-medium">{task.title}</div>
                      <div className="text-xs text-[var(--text-secondary)]">
                        {task.priority} priority • {task.estimatedTime}
                      </div>
                    </div>
                  ))}
                  {template.tasks.length > 3 && (
                    <div className="text-xs text-[var(--text-secondary)] text-center">
                      +{template.tasks.length - 3} more tasks
                    </div>
                  )}
                </div>

                <div className="flex gap-2 text-xs mb-3">
                  <span className="px-2 py-1 bg-[var(--accent)]/20 text-[var(--accent)] rounded-full">
                    {template.category}
                  </span>
                </div>

                <button onClick={() => useTemplate(template)}
                  className="w-full btn-primary py-2 rounded-lg text-sm">
                  Use Template ({template.tasks.length} tasks)
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {editingTemplate && (
        <TemplateEditor
          template={editingTemplate}
          onSave={saveCustomTemplate}
          onCancel={() => setEditingTemplate(null)}
        />
      )}
    </div>
  );
}

function TemplateEditor({ template, onSave, onCancel }) {
  const [form, setForm] = useState(template);

  const addTask = () => {
    setForm({
      ...form,
      tasks: [...form.tasks, { title: '', priority: 'medium', estimatedTime: '30 minutes' }]
    });
  };

  const updateTask = (index, field, value) => {
    const newTasks = [...form.tasks];
    newTasks[index] = { ...newTasks[index], [field]: value };
    setForm({ ...form, tasks: newTasks });
  };

  const removeTask = (index) => {
    setForm({ ...form, tasks: form.tasks.filter((_, i) => i !== index) });
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/50">
      <div className="w-full max-w-2xl bg-[var(--bg-primary)] rounded-xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b border-[var(--border-color)]">
          <h3 className="text-lg font-semibold">Edit Template</h3>
        </div>

        <div className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Template Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="input-field w-full px-3 py-2 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <input
                type="text"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="input-field w-full px-3 py-2 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="input-field w-full px-3 py-2 rounded-lg resize-none"
              rows={2}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium">Tasks</label>
              <button onClick={addTask}
                className="px-3 py-1 bg-[var(--accent)] text-white rounded text-sm">
                <FiPlus size={14} className="inline mr-1" /> Add Task
              </button>
            </div>

            <div className="space-y-2">
              {form.tasks.map((task, i) => (
                <div key={i} className="flex gap-2 p-3 bg-[var(--bg-secondary)] rounded-lg">
                  <div className="flex-1 space-y-2">
                    <input
                      type="text"
                      value={task.title}
                      onChange={(e) => updateTask(i, 'title', e.target.value)}
                      placeholder="Task title"
                      className="input-field w-full px-2 py-1 rounded text-sm"
                    />
                    <div className="flex gap-2">
                      <select
                        value={task.priority}
                        onChange={(e) => updateTask(i, 'priority', e.target.value)}
                        className="input-field px-2 py-1 rounded text-sm">
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                      <input
                        type="text"
                        value={task.estimatedTime}
                        onChange={(e) => updateTask(i, 'estimatedTime', e.target.value)}
                        placeholder="30 minutes"
                        className="input-field flex-1 px-2 py-1 rounded text-sm"
                      />
                    </div>
                  </div>
                  <button onClick={() => removeTask(i)}
                    className="p-1 text-red-500 hover:bg-red-500/10 rounded">
                    <FiTrash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button onClick={onCancel}
              className="flex-1 px-4 py-2 border border-[var(--border-color)] rounded-lg hover:bg-[var(--bg-secondary)]">
              Cancel
            </button>
            <button onClick={() => onSave(form)}
              className="flex-1 btn-primary px-4 py-2 rounded-lg">
              Save Template
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}