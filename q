[33mcommit 623533a6437f375e0b76662fc16a633ac300a603[m[33m ([m[1;36mHEAD -> [m[1;32mmain[m[33m)[m
Author: Gaven Pearl <127455079+xGOBx@users.noreply.github.com>
Date:   Mon Dec 15 18:17:46 2025 -0500

    Add retry logic and multi-select coins with custom input
    
            Added exponential backoff retry (up to 5 attempts) for price fetching
            Changed coins setting from text input to multi-select dropdown with 25 popular cryptocurrencies
            Added custom coins field for users to add coins not in preset list
            Implemented automatic deduplication to prevent duplicate coins
            Fixed settings extraction to properly read values from payload structure

[33mcommit 9b248739199edfaaa14fd6886d287c35b8d0c25f[m
Author: Gaven Pearl <127455079+xGOBx@users.noreply.github.com>
Date:   Mon Dec 15 17:58:33 2025 -0500

    Updated Supported Coins and fixed settings bug

[33mcommit 85e3e7cc06a667dd5cffe8f5b0d579ed1160f728[m[33m ([m[1;31morigin/main[m[33m)[m
Author: Gaven Pearl <127455079+xGOBx@users.noreply.github.com>
Date:   Sat Dec 13 21:03:19 2025 -0500

    Updated README and added gitignore

[33mcommit 3ad7ea8df7b95e0a1e390518307435aeec5658f6[m
Author: Gaven Pearl <127455079+xGOBx@users.noreply.github.com>
Date:   Sat Dec 13 20:47:02 2025 -0500

    Updated naming of app for icon recognition
            crypto-tracker to cryptotracker

[33mcommit 81969c78aff9c07ea565bf59f2109e34d9ef3d92[m
Author: Gaven Pearl <127455079+xGOBx@users.noreply.github.com>
Date:   Sat Dec 13 19:46:21 2025 -0500

    Added Logo icon

[33mcommit a9f0612f663f056b004edc7ae9c9a8e68164b204[m
Author: Gaven Pearl <127455079+xGOBx@users.noreply.github.com>
Date:   Sat Dec 13 19:15:22 2025 -0500

    Updated Mainifest

[33mcommit 21ff6a5f62c8c837373d77d024c4405113f6544e[m
Author: Gaven Pearl <127455079+xGOBx@users.noreply.github.com>
Date:   Sat Dec 13 19:00:11 2025 -0500

    Initializing Project
    
            Adding base Project

[33mcommit 4a0eaff8797ff616b82e8c1585cb6a87e17cc04c[m
Author: Gaven Pearl <127455079+iamGaven@users.noreply.github.com>
Date:   Sat Dec 13 19:03:35 2025 -0500

    Initial commit
