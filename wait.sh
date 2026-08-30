while true; do
  if grep -q "built in" /tmp/task-376.log 2>/dev/null; then break; fi
  if grep -q "failed" /tmp/task-376.log 2>/dev/null; then break; fi
  sleep 1
done
