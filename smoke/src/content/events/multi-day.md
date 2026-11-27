---
# Always in progress on purpose: started long ago, ends far in the future, so
# the package-smoke "Output guards" can assert that a multi-day event counts
# as upcoming until its last day is over. The talks are written out of order
# with one undated, to pin the schedule order (undated first, then by day).
title: "Multi-day fixture"
date: 2020-01-01
endDate: 2099-12-31
time: "9:00 AM each day"
talks:
  - title: "Second-day session"
    date: "2020-01-02"
  - title: "Undated session"
    date:
  - title: "First-day session"
    date: 2020-01-01
---
A fixture event that never ends, so the upcoming-or-past guard cannot rot.
