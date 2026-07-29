UPDATE registration_requests
SET campus = CASE campus
  WHEN 'Boys Campus' THEN 'FGS Ravi Road Boys Campus'
  WHEN 'Girls Campus' THEN 'FGS Ravi Road Girls Campus'
  WHEN 'Kids Campus' THEN 'FGS Ravi Road Kids Campus'
  WHEN 'Edward Road Campus' THEN 'FGS Edward Road (PG to Matric)'
  ELSE campus
END
WHERE campus IN (
  'Boys Campus',
  'Girls Campus',
  'Kids Campus',
  'Edward Road Campus'
);
