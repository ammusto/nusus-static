import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import './About.css';

const AboutPage = () => {
    const [teamMembers, setTeamMembers] = useState([]);

    useEffect(() => {
        const loadTeamData = async () => {
            const response = await fetch('/team/team.csv');
            const reader = response.body.getReader();
            const result = await reader.read();
            const decoder = new TextDecoder('utf-8');
            const csv = decoder.decode(result.value);
            const { data } = Papa.parse(csv, { header: true });
            const filteredData = data.filter(row => (
                Object.values(row).some(value => value !== undefined && value.trim() !== '')
            ));
            setTeamMembers(filteredData);
        };

        loadTeamData();
    }, []);

    return (
        <div className="container">
            <div className="main">
                <div className='text-content'>
                    <div>
                        <h2>Our Team</h2>
                        <div className="team-members">
                            {teamMembers.map((member) => (
                                <div key={member.mem_id} className="team_mem">
                                    <img className="mem_photo" src={`/team/${member.photo}`} alt={member.name} />
                                    <h3 style={{ textAlign: 'center' }}>
                                        <a href={member.website}>{member.name}</a>
                                    </h3>
                                    <h5 className="mem_role">{member.role}</h5>
                                    <p>{member.bio}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div>
                        <h2>About</h2>
                        <p>This web app was developped and designed by Antonio Musto using react. It was originally designed utilizing the django web framework, however for the sake of preserving the website and data, it was converted to a static site using flat-file databases and indices.</p>
                        <p>If you are interested in learning more or potentially contributing to Nuṣūs, please <a href="mailto:nususcorpus@gmail.com"> contact us</a>!</p>

                        <h2>Acknowledgements</h2>
                        <p>Initial funding for this project came from an NYU digtial humanities fellowship. Realizing the utility of these digitized texts, this project was expanded and made available to others online.</p>

                        <h2>Copyright</h2>
                        <p>In terms of copyright, this project is in alignment with <a href="https://openiti.org/docs/Copyright_Questions.html">OpenITI's position</a>. In brief, because these texts were originally written prior to 1900, they are in the public domain. All editorial content, including introductions, footnotes, etc. have been removed from the texts prior to digitization.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AboutPage;