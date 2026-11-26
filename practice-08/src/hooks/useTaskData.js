import { useEffect, useRef, useState } from 'react';

// Основное задание ПР8. Реализовать эффекты и операции по контракту методички.
// api передаётся зависимостью, поэтому хук проверяется без настоящей сети.
export function useTaskData({ api, filters }) {
  const [snapshot, setSnapshot] = useState({ tasks: [], categories: [], meta: { total: 0 } });
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);
  const [mutationError, setMutationError] = useState(null);
  const [pending, setPending] = useState(false);
  const [revision, setRevision] = useState(0);
  const mountedRef = useRef(false);
  const mutationControllerRef = useRef(null);
  const { q, completed, priority, categoryId } = filters;

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      mutationControllerRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    setStatus('loading');
    setError(null);

    async function load() {
      try {
        const result = await api.loadInitialData(
          { q, completed, priority, categoryId },
          { signal: controller.signal },
        );
        if (!active || controller.signal.aborted) return;
        setSnapshot(result);
        setStatus('ready');
      } catch (loadError) {
        if (!active || controller.signal.aborted) return;
        setError(loadError);
        setStatus('error');
      }
    }

    void load();
    return () => {
      active = false;
      controller.abort();
    };
  }, [api, q, completed, priority, categoryId, revision]);

  async function mutate(operation) {
    if (!mountedRef.current || mutationControllerRef.current) return false;
    const controller = new AbortController();
    mutationControllerRef.current = controller;
    setPending(true);
    setMutationError(null);
    try {
      await operation(controller.signal);
      if (!mountedRef.current || controller.signal.aborted) return false;
      setRevision(previous => previous + 1);
      return true;
    } catch (operationError) {
      if (mountedRef.current && !controller.signal.aborted) setMutationError(operationError);
      return false;
    } finally {
      if (mutationControllerRef.current === controller) {
        mutationControllerRef.current = null;
        if (mountedRef.current) setPending(false);
      }
    }
  }

  return {
    snapshot, status, error, mutationError, pending,
    refresh() { setRevision(previous => previous + 1); },
    saveTask(id, value) {
      return id === null
        ? mutate(signal => api.createTask(value, { signal }))
        : mutate(signal => api.updateTask(id, value, { signal }));
    },
    toggleTask(task) {
      return mutate(signal => api.setTaskCompleted(task.id, !task.completed, { signal }));
    },
    deleteTask(id) {
      return mutate(signal => api.deleteTask(id, { signal }));
    },
    resetData() {
      return mutate(signal => api.resetDemoData({ signal }));
    },
  };
}
