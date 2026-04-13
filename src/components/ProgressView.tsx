import { Box, LinearProgress, Stack, Typography } from '@mui/material';
import type { StudyPlanRow } from '../types';
import { computeOverallCompletion, groupByWeek } from '../utils/progress';

type Props = {
  studyPlan: StudyPlanRow[];
};

export default function ProgressView({ studyPlan }: Props) {
  const overall = computeOverallCompletion(studyPlan);
  const byWeek = groupByWeek(studyPlan);

  return (
    <Stack spacing={2}>
      <Box>
        <Typography variant="h6">Overall completion</Typography>
        <Stack direction="row" spacing={2} alignItems="center">
          <Box sx={{ flex: 1 }}>
            <LinearProgress variant="determinate" value={overall} />
          </Box>
          <Typography variant="body1" sx={{ minWidth: 48 }}>
            {overall}%
          </Typography>
        </Stack>
      </Box>

      <Box>
        <Typography variant="h6">Weekly breakdown</Typography>
        <Stack spacing={1.2}>
          {byWeek.map((w) => (
            <Stack key={w.weekLabel} direction="row" spacing={2} alignItems="center">
              <Typography sx={{ width: 90 }}>{w.weekLabel}</Typography>
              <Box sx={{ flex: 1 }}>
                <LinearProgress variant="determinate" value={w.completion} />
              </Box>
              <Typography sx={{ width: 120, textAlign: 'right' }}>
                {w.completion}% ({w.done}/{w.total})
              </Typography>
            </Stack>
          ))}
        </Stack>
      </Box>
    </Stack>
  );
}
