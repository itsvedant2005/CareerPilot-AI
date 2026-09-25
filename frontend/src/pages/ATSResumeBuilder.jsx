import React, {
  useEffect,
  useState,
} from "react";

import axios from "axios";

import { useNavigate } from "react-router-dom";


/* =========================================================
   API
========================================================= */

const API_BASE =
  "https://careerpilot-ai-pcqc.onrender.com";


/* =========================================================
   URL HELPER
========================================================= */

const normalizeUrl = (value) => {

  const url =
    String(value || "").trim();

  if (!url) {
    return "";
  }

  if (
    /^https?:\/\//i.test(url)
  ) {
    return url;
  }

  return `https://${url}`;
};


/* =========================================================
   EMPTY DATA
========================================================= */

const createEmptyEducation = () => ({
  degree: "",
  institution: "",
  location: "",
  year: "",
  cgpa: "",
  percentage: "",
});


const createEmptyInternship = () => ({
  title: "",
  company: "",
  location: "",
  duration: "",
  description: "",
});


const createEmptyExperience = () => ({
  title: "",
  company: "",
  location: "",
  duration: "",
  description: "",
});


const createEmptyProject = () => ({
  title: "",
  technologies: "",
  description: "",
  url: "",
});


const createEmptyCredential = () => ({
  title: "",
  issuer: "",
  year: "",
  url: "",
});


/* =========================================================
   FIELD
   Defined outside component to prevent focus problems.
========================================================= */

function Field({
  label,
  value,
  onChange,
  placeholder = "",
  type = "text",
}) {

  return (
    <div className="cp-field">

      <label>
        {label}
      </label>

      <input
        type={type}
        value={value ?? ""}
        placeholder={placeholder}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
      />

    </div>
  );
}


/* =========================================================
   TEXTAREA
========================================================= */

function TextArea({
  label,
  value,
  onChange,
  placeholder = "",
}) {

  return (
    <div className="cp-field cp-full">

      <label>
        {label}
      </label>

      <textarea
        value={value ?? ""}
        placeholder={placeholder}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
      />

    </div>
  );
}


/* =========================================================
   RESUME SECTION
========================================================= */

function ResumeSection({
  title,
  children,
}) {

  return (
    <section className="resume-section">

      <h2>
        {title}
      </h2>

      {children}

    </section>
  );
}


/* =========================================================
   RESUME PREVIEW
========================================================= */

function ResumePreview({
  resume,
}) {

  /* -------------------------------------------------------
     NO GENERATED RESUME YET
  ------------------------------------------------------- */

  if (!resume) {

    return (
      <div className="resume-paper">

        <div className="resume-header">

          <h1>
            Your Name
          </h1>

          <div className="resume-placeholder">
            Generate your resume to see the live preview.
          </div>

        </div>

      </div>
    );
  }


  /* -------------------------------------------------------
     DATA
  ------------------------------------------------------- */

  const personal =
    resume.personal || {};

  const education =
    Array.isArray(
      resume.education
    )
      ? resume.education
      : [];

  const experience =
    Array.isArray(
      resume.experience
    )
      ? resume.experience
      : [];

  const internships =
    Array.isArray(
      resume.internships
    )
      ? resume.internships
      : [];

  const skills =
    Array.isArray(
      resume.skills
    )
      ? resume.skills
      : [];

  const projects =
    Array.isArray(
      resume.projects
    )
      ? resume.projects
      : [];

  const certifications =
    Array.isArray(
      resume.certifications
    )
      ? resume.certifications
      : [];

  const achievements =
    Array.isArray(
      resume.achievements
    )
      ? resume.achievements
      : [];


  console.log(
    "LIVE PREVIEW DATA:",
    resume
  );


  /* -------------------------------------------------------
     RENDER
  ------------------------------------------------------- */

  return (
    <div className="resume-paper">


      {/* ===================================================
          HEADER
      =================================================== */}

      <div className="resume-header">

        <h1>
          {
            personal.name ||
            "Your Name"
          }
        </h1>


        <div className="resume-contact">

          {personal.email && (
            <span>
              {personal.email}
            </span>
          )}


          {personal.phone && (
            <>
              <span>
                {" | "}
              </span>

              <span>
                {personal.phone}
              </span>
            </>
          )}


          {personal.location && (
            <>
              <span>
                {" | "}
              </span>

              <span>
                {personal.location}
              </span>
            </>
          )}

        </div>


        <div className="resume-profile-links">

          {personal.linkedin && (

            <a
              href={
                normalizeUrl(
                  personal.linkedin
                )
              }
              target="_blank"
              rel="noopener noreferrer"
            >
              LinkedIn
            </a>

          )}


          {personal.github && (

            <a
              href={
                normalizeUrl(
                  personal.github
                )
              }
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
            </a>

          )}


          {personal.portfolio && (

            <a
              href={
                normalizeUrl(
                  personal.portfolio
                )
              }
              target="_blank"
              rel="noopener noreferrer"
            >
              Portfolio
            </a>

          )}

        </div>

      </div>


      {/* ===================================================
          SUMMARY
      =================================================== */}

      {resume.professional_summary && (

        <ResumeSection
          title="PROFESSIONAL SUMMARY"
        >

          <p className="resume-summary">
            {
              resume.professional_summary
            }
          </p>

        </ResumeSection>

      )}


      {/* ===================================================
          EDUCATION
      =================================================== */}

      {education.length > 0 && (

        <ResumeSection
          title="EDUCATION"
        >

          {education.map(
            (item, index) => (

              <div
                className="resume-item"
                key={index}
              >

                <div className="resume-item-top">

                  <strong>
                    {
                      item.degree ||
                      item.program ||
                      item.name
                    }
                  </strong>

                  <span>
                    {
                      item.year ||
                      item.duration
                    }
                  </span>

                </div>


                {item.institution && (
                  <div>
                    {
                      item.institution
                    }
                  </div>
                )}


                {item.location && (
                  <div className="resume-muted">
                    {
                      item.location
                    }
                  </div>
                )}


                {item.cgpa && (
                  <div className="resume-muted">
                    CGPA: {item.cgpa}
                  </div>
                )}


                {item.percentage && (
                  <div className="resume-muted">
                    Percentage: {item.percentage}
                  </div>
                )}

              </div>

            )
          )}

        </ResumeSection>

      )}


      {/* ===================================================
          EXPERIENCE
      =================================================== */}

      {experience.length > 0 && (

        <ResumeSection
          title="WORK EXPERIENCE"
        >

          {experience.map(
            (item, index) => (

              <div
                className="resume-item"
                key={index}
              >

                <div className="resume-item-top">

                  <strong>
                    {
                      item.title ||
                      item.role ||
                      item.position
                    }
                  </strong>

                  <span>
                    {
                      item.duration ||
                      item.year
                    }
                  </span>

                </div>


                {(item.company ||
                  item.location) && (

                  <div>

                    {
                      item.company
                    }

                    {item.company &&
                      item.location &&
                      " | "}

                    {
                      item.location
                    }

                  </div>

                )}


                {Array.isArray(
                  item.description
                ) && (

                  <ul>

                    {item.description.map(
                      (
                        bullet,
                        bulletIndex
                      ) => (

                        <li
                          key={
                            bulletIndex
                          }
                        >
                          {
                            bullet
                          }
                        </li>

                      )
                    )}

                  </ul>

                )}


                {typeof item.description ===
                  "string" &&
                  item.description && (

                    <ul>

                      <li>
                        {
                          item.description
                        }
                      </li>

                    </ul>

                  )}

              </div>

            )
          )}

        </ResumeSection>

      )}


      {/* ===================================================
          INTERNSHIPS
      =================================================== */}

      {internships.length > 0 && (

        <ResumeSection
          title="INTERNSHIPS"
        >

          {internships.map(
            (item, index) => (

              <div
                className="resume-item"
                key={index}
              >

                <div className="resume-item-top">

                  <strong>
                    {
                      item.title ||
                      item.role
                    }
                  </strong>

                  <span>
                    {
                      item.duration ||
                      item.year
                    }
                  </span>

                </div>


                {(item.company ||
                  item.location) && (

                  <div>

                    {
                      item.company
                    }

                    {item.company &&
                      item.location &&
                      " | "}

                    {
                      item.location
                    }

                  </div>

                )}


                {Array.isArray(
                  item.description
                ) && (

                  <ul>

                    {item.description.map(
                      (
                        bullet,
                        bulletIndex
                      ) => (

                        <li
                          key={
                            bulletIndex
                          }
                        >
                          {
                            bullet
                          }
                        </li>

                      )
                    )}

                  </ul>

                )}


                {typeof item.description ===
                  "string" &&
                  item.description && (

                    <ul>

                      <li>
                        {
                          item.description
                        }
                      </li>

                    </ul>

                  )}

              </div>

            )
          )}

        </ResumeSection>

      )}


      {/* ===================================================
          SKILLS
      =================================================== */}

      {skills.length > 0 && (

        <ResumeSection
          title="SKILLS"
        >

          <p className="skills-line">

            {
              skills.join(
                " • "
              )
            }

          </p>

        </ResumeSection>

      )}


      {/* ===================================================
          PROJECTS
      =================================================== */}

      {projects.length > 0 && (

        <ResumeSection
          title="PROJECTS"
        >

          {projects.map(
            (item, index) => (

              <div
                className="resume-item"
                key={index}
              >

                <div className="resume-project-title">

                  <strong>
                    {
                      item.title ||
                      item.name
                    }
                  </strong>


                  {item.url && (

                    <a
                      href={
                        normalizeUrl(
                          item.url
                        )
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Project Link
                    </a>

                  )}

                </div>


                {item.technologies && (

                  <div className="resume-muted">

                    {
                      Array.isArray(
                        item.technologies
                      )
                        ? item.technologies.join(
                            ", "
                          )
                        : item.technologies
                    }

                  </div>

                )}


                {Array.isArray(
                  item.description
                ) && (

                  <ul>

                    {item.description.map(
                      (
                        bullet,
                        bulletIndex
                      ) => (

                        <li
                          key={
                            bulletIndex
                          }
                        >
                          {
                            bullet
                          }
                        </li>

                      )
                    )}

                  </ul>

                )}


                {typeof item.description ===
                  "string" &&
                  item.description && (

                    <ul>
                      <li>
                        {
                          item.description
                        }
                      </li>
                    </ul>

                  )}

              </div>

            )
          )}

        </ResumeSection>

      )}


      {/* ===================================================
          CERTIFICATIONS
      =================================================== */}

      {certifications.length > 0 && (

        <ResumeSection
          title="CERTIFICATIONS"
        >

          {certifications.map(
            (item, index) => (

              <div
                className="resume-item"
                key={index}
              >

                <strong>
                  {
                    item.title ||
                    item.name
                  }
                </strong>


                {item.issuer && (
                  <span>
                    {" — "}
                    {
                      item.issuer
                    }
                  </span>
                )}


                {item.year && (
                  <span>
                    {" ("}
                    {
                      item.year
                    }
                    {")"}
                  </span>
                )}


                {item.url && (

                  <>
                    {" "}

                    <a
                      href={
                        normalizeUrl(
                          item.url
                        )
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Credential
                    </a>
                  </>

                )}

              </div>

            )
          )}

        </ResumeSection>

      )}


      {/* ===================================================
          ACHIEVEMENTS
      =================================================== */}

      {achievements.length > 0 && (

        <ResumeSection
          title="ACHIEVEMENTS"
        >

          {achievements.map(
            (item, index) => (

              <div
                className="resume-item"
                key={index}
              >

                <strong>
                  {
                    item.title ||
                    item.name
                  }
                </strong>


                {item.issuer && (
                  <span>
                    {" — "}
                    {
                      item.issuer
                    }
                  </span>
                )}


                {item.year && (
                  <span>
                    {" ("}
                    {
                      item.year
                    }
                    {")"}
                  </span>
                )}


                {item.url && (

                  <>
                    {" "}

                    <a
                      href={
                        normalizeUrl(
                          item.url
                        )
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Proof
                    </a>
                  </>

                )}

              </div>

            )
          )}

        </ResumeSection>

      )}

    </div>
  );
}


/* =========================================================
   MAIN COMPONENT
========================================================= */

export default function ATSResumeBuilder() {

  const navigate =
    useNavigate();


  /* =======================================================
     SOURCE
  ======================================================= */

  const [
    selectedSource,
    setSelectedSource,
  ] = useState(
    "previous"
  );


  /* =======================================================
     TEMPLATE
  ======================================================= */

  const [
    selectedTemplate,
    setSelectedTemplate,
  ] = useState(
    "minimal"
  );


  /* =======================================================
     TARGET ROLE
  ======================================================= */

  const [
    targetRole,
    setTargetRole,
  ] = useState("");


  /* =======================================================
     MANUAL DATA
  ======================================================= */

  const [
    manualData,
    setManualData,
  ] = useState({

    name: "",

    email: "",

    phone: "",

    location: "",

    linkedin: "",

    github: "",

    portfolio: "",

    professional_summary: "",

    education: [
      createEmptyEducation()
    ],

    internshipEnabled: false,

    internships: [
      createEmptyInternship()
    ],

    experienceEnabled: false,

    experience: [
      createEmptyExperience()
    ],

    skills: "",

    projects: [
      createEmptyProject()
    ],

    certifications: [
      createEmptyCredential()
    ],

    achievements: [
      createEmptyCredential()
    ],
  });


  /* =======================================================
     GENERATED RESUME
  ======================================================= */

  const [
    generatedResume,
    setGeneratedResume,
  ] = useState(null);


  /* =======================================================
     LATEST ANALYZED RESUME
  ======================================================= */

  const [
    latestAnalyzedResume,
    setLatestAnalyzedResume,
  ] = useState(null);


  /* =======================================================
     LOADING
  ======================================================= */

  const [
    loading,
    setLoading,
  ] = useState(true);


  const [
    generating,
    setGenerating,
  ] = useState(false);


  const [
    saving,
    setSaving,
  ] = useState(false);


  /* =======================================================
     MESSAGES
  ======================================================= */

  const [
    successMessage,
    setSuccessMessage,
  ] = useState("");


  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");


  /* =======================================================
     TOKEN
  ======================================================= */

  const getToken = () => {

    const token =
      localStorage.getItem(
        "access_token"
      );

    if (!token) {

      throw new Error(
        "You are not logged in."
      );
    }

    return token;
  };


  /* =======================================================
     AUTH CONFIG
  ======================================================= */

  const getAuthConfig = () => {

    return {
      headers: {
        Authorization:
          `Bearer ${getToken()}`
      }
    };
  };


  /* =======================================================
     AUTH FAILURE
  ======================================================= */

  const forceLogin = () => {

    localStorage.removeItem(
      "access_token"
    );

    localStorage.removeItem(
      "careerpilot_token"
    );

    navigate(
      "/login"
    );
  };


  /* =======================================================
     LOAD DATA ON PAGE OPEN
  ======================================================= */

  useEffect(() => {

    const loadAllData =
      async () => {

        setLoading(true);

        setErrorMessage("");

        try {

          const token =
            localStorage.getItem(
              "access_token"
            );


          if (!token) {

            forceLogin();

            return;
          }


          /* ===============================================
             LOAD PROFILE
          =============================================== */

          const profileResponse =
            await axios.get(
              `${API_BASE}/api/auth/me`,
              {
                headers: {
                  Authorization:
                    `Bearer ${token}`
                }
              }
            );


          const profile =
            profileResponse.data;


          if (
            profile?.target_role
          ) {

            setTargetRole(
              profile.target_role
            );
          }


          setManualData(
            (previous) => ({
              ...previous,

              name:
                previous.name ||
                profile?.name ||
                "",

              email:
                previous.email ||
                profile?.email ||
                "",
            })
          );


          /* ===============================================
             LOAD LATEST ANALYZED RESUME
          =============================================== */

          const analyzerResponse =
            await axios.get(
              `${API_BASE}/api/resume/latest`,
              {
                headers: {
                  Authorization:
                    `Bearer ${token}`
                }
              }
            );


          const latestAnalyzerResume =
            analyzerResponse.data?.resume ||
            null;


          setLatestAnalyzedResume(
            latestAnalyzerResume
          );


          /* ===============================================
             LOAD LATEST GENERATED RESUME
          =============================================== */

          const builderResponse =
            await axios.get(
              `${API_BASE}/api/resume-builder/latest`,
              {
                headers: {
                  Authorization:
                    `Bearer ${token}`
                }
              }
            );


          const latestGenerated =
            builderResponse.data
              ?.resume
              ?.generated_content;


          if (
            latestGenerated &&
            typeof latestGenerated ===
              "object"
          ) {

            setGeneratedResume(
              latestGenerated
            );
          }

        } catch (error) {

          console.error(
            "LOAD BUILDER ERROR:",
            error
          );


          if (
            error.response?.status ===
            401
          ) {

            forceLogin();

            return;
          }


          setErrorMessage(
            error.response?.data?.detail ||
            error.message ||
            "Failed to load Resume Builder."
          );

        } finally {

          setLoading(false);
        }

      };


    loadAllData();

  }, []);


  /* =======================================================
     REFRESH LATEST ANALYZED RESUME
  ======================================================= */

  const refreshLatestAnalyzedResume =
    async () => {

      setErrorMessage("");

      try {

        const response =
          await axios.get(
            `${API_BASE}/api/resume/latest`,
            getAuthConfig()
          );


        const latest =
          response.data?.resume ||
          null;


        setLatestAnalyzedResume(
          latest
        );


        if (latest) {

          setSuccessMessage(
            "Latest analyzed resume refreshed."
          );

        } else {

          setErrorMessage(
            "No analyzed resume found."
          );
        }

      } catch (error) {

        console.error(
          "REFRESH ANALYZER ERROR:",
          error
        );


        if (
          error.response?.status ===
          401
        ) {

          forceLogin();

          return;
        }


        setErrorMessage(
          error.response?.data?.detail ||
          "Failed to refresh analyzed resume."
        );
      }
    };


  /* =======================================================
     UPDATE MANUAL FIELD
  ======================================================= */

  const updateManualField =
    (
      field,
      value
    ) => {

      setManualData(
        (previous) => ({
          ...previous,
          [field]: value
        })
      );
    };


  /* =======================================================
     EDUCATION
  ======================================================= */

  const updateEducation =
    (
      index,
      field,
      value
    ) => {

      setManualData(
        (previous) => {

          const updated =
            [...previous.education];

          updated[index] = {
            ...updated[index],
            [field]: value
          };

          return {
            ...previous,
            education:
              updated
          };
        }
      );
    };


  const addEducation =
    () => {

      setManualData(
        (previous) => ({
          ...previous,

          education: [
            ...previous.education,

            createEmptyEducation()
          ]
        })
      );
    };


  const removeEducation =
    (index) => {

      setManualData(
        (previous) => ({
          ...previous,

          education:
            previous.education.filter(
              (_, i) =>
                i !== index
            )
        })
      );
    };


  /* =======================================================
     INTERNSHIPS
  ======================================================= */

  const updateInternship =
    (
      index,
      field,
      value
    ) => {

      setManualData(
        (previous) => {

          const updated =
            [...previous.internships];

          updated[index] = {
            ...updated[index],
            [field]: value
          };

          return {
            ...previous,
            internships:
              updated
          };
        }
      );
    };


  const addInternship =
    () => {

      setManualData(
        (previous) => ({
          ...previous,

          internships: [
            ...previous.internships,

            createEmptyInternship()
          ]
        })
      );
    };


  const removeInternship =
    (index) => {

      setManualData(
        (previous) => ({
          ...previous,

          internships:
            previous.internships.filter(
              (_, i) =>
                i !== index
            )
        })
      );
    };


  /* =======================================================
     EXPERIENCE
  ======================================================= */

  const updateExperience =
    (
      index,
      field,
      value
    ) => {

      setManualData(
        (previous) => {

          const updated =
            [...previous.experience];

          updated[index] = {
            ...updated[index],
            [field]: value
          };

          return {
            ...previous,
            experience:
              updated
          };
        }
      );
    };


  const addExperience =
    () => {

      setManualData(
        (previous) => ({
          ...previous,

          experience: [
            ...previous.experience,

            createEmptyExperience()
          ]
        })
      );
    };


  const removeExperience =
    (index) => {

      setManualData(
        (previous) => ({
          ...previous,

          experience:
            previous.experience.filter(
              (_, i) =>
                i !== index
            )
        })
      );
    };


  /* =======================================================
     PROJECTS
  ======================================================= */

  const updateProject =
    (
      index,
      field,
      value
    ) => {

      setManualData(
        (previous) => {

          const updated =
            [...previous.projects];

          updated[index] = {
            ...updated[index],
            [field]: value
          };

          return {
            ...previous,
            projects:
              updated
          };
        }
      );
    };


  const addProject =
    () => {

      setManualData(
        (previous) => ({
          ...previous,

          projects: [
            ...previous.projects,

            createEmptyProject()
          ]
        })
      );
    };


  const removeProject =
    (index) => {

      setManualData(
        (previous) => ({
          ...previous,

          projects:
            previous.projects.filter(
              (_, i) =>
                i !== index
            )
        })
      );
    };


  /* =======================================================
     CERTIFICATIONS
  ======================================================= */

  const updateCertification =
    (
      index,
      field,
      value
    ) => {

      setManualData(
        (previous) => {

          const updated =
            [...previous.certifications];

          updated[index] = {
            ...updated[index],
            [field]: value
          };

          return {
            ...previous,
            certifications:
              updated
          };
        }
      );
    };


  const addCertification =
    () => {

      setManualData(
        (previous) => ({
          ...previous,

          certifications: [
            ...previous.certifications,

            createEmptyCredential()
          ]
        })
      );
    };


  const removeCertification =
    (index) => {

      setManualData(
        (previous) => ({
          ...previous,

          certifications:
            previous.certifications.filter(
              (_, i) =>
                i !== index
            )
        })
      );
    };


  /* =======================================================
     ACHIEVEMENTS
  ======================================================= */

  const updateAchievement =
    (
      index,
      field,
      value
    ) => {

      setManualData(
        (previous) => {

          const updated =
            [...previous.achievements];

          updated[index] = {
            ...updated[index],
            [field]: value
          };

          return {
            ...previous,
            achievements:
              updated
          };
        }
      );
    };


  const addAchievement =
    () => {

      setManualData(
        (previous) => ({
          ...previous,

          achievements: [
            ...previous.achievements,

            createEmptyCredential()
          ]
        })
      );
    };


  const removeAchievement =
    (index) => {

      setManualData(
        (previous) => ({
          ...previous,

          achievements:
            previous.achievements.filter(
              (_, i) =>
                i !== index
            )
        })
      );
    };


  /* =======================================================
     PREPARE MANUAL DATA
  ======================================================= */

  const buildManualPayload =
    () => {

      return {

        name:
          manualData.name,

        email:
          manualData.email,

        phone:
          manualData.phone,

        location:
          manualData.location,

        linkedin:
          manualData.linkedin,

        github:
          manualData.github,

        portfolio:
          manualData.portfolio,

        professional_summary:
          manualData.professional_summary,

        education:
          manualData.education.filter(
            (item) =>
              Object.values(item)
                .some(
                  (value) =>
                    String(
                      value ?? ""
                    ).trim()
                )
          ),

        internships:
          manualData.internshipEnabled
            ? manualData.internships.filter(
                (item) =>
                  Object.values(item)
                    .some(
                      (value) =>
                        String(
                          value ?? ""
                        ).trim()
                    )
              )
            : [],

        experience:
          manualData.experienceEnabled
            ? manualData.experience.filter(
                (item) =>
                  Object.values(item)
                    .some(
                      (value) =>
                        String(
                          value ?? ""
                        ).trim()
                    )
              )
            : [],

        skills:
          String(
            manualData.skills || ""
          )
            .split(",")
            .map(
              (item) =>
                item.trim()
            )
            .filter(Boolean),

        projects:
          manualData.projects.filter(
            (item) =>
              Object.values(item)
                .some(
                  (value) =>
                    String(
                      value ?? ""
                    ).trim()
                )
          ),

        certifications:
          manualData.certifications.filter(
            (item) =>
              Object.values(item)
                .some(
                  (value) =>
                    String(
                      value ?? ""
                    ).trim()
                )
          ),

        achievements:
          manualData.achievements.filter(
            (item) =>
              Object.values(item)
                .some(
                  (value) =>
                    String(
                      value ?? ""
                    ).trim()
                )
          ),
      };
    };


  /* =======================================================
     GENERATE
  ======================================================= */

  const handleGenerate =
    async () => {

      setSuccessMessage("");

      setErrorMessage("");

      setGenerating(true);


      try {

        const token =
          getToken();


        let requestBody = {

          source:
            selectedSource,

          template:
            selectedTemplate,

          target_role:
            targetRole,
        };


        /* -----------------------------------------------
           PREVIOUS
           
           IMPORTANT:
           Do not send old resume data.
           Backend fetches latest analyzer result.
        ------------------------------------------------ */

        if (
          selectedSource ===
          "previous"
        ) {

          if (
            !latestAnalyzedResume
          ) {

            throw new Error(
              "No analyzed resume found. Upload and analyze a resume first."
            );
          }

        }


        /* -----------------------------------------------
           MANUAL
        ------------------------------------------------ */

        if (
          selectedSource ===
          "manual"
        ) {

          if (
            !manualData.name.trim()
          ) {

            throw new Error(
              "Name is required."
            );
          }


          requestBody = {

            ...requestBody,

            resume_data:
              buildManualPayload()
          };
        }


        console.log(
          "===================================="
        );

        console.log(
          "BUILDER REQUEST:"
        );

        console.log(
          requestBody
        );

        console.log(
          "===================================="
        );


        /* -----------------------------------------------
           API
        ------------------------------------------------ */

        const response =
          await axios.post(

            `${API_BASE}/api/resume-builder/generate`,

            requestBody,

            {
              headers: {
                Authorization:
                  `Bearer ${token}`,

                "Content-Type":
                  "application/json"
              }
            }
          );


        console.log(
          "===================================="
        );

        console.log(
          "BUILDER RESPONSE:"
        );

        console.log(
          response.data
        );

        console.log(
          "===================================="
        );


        /* -----------------------------------------------
           GET GENERATED CONTENT
        ------------------------------------------------ */

        const generated =
          response.data
            ?.resume
            ?.generated_content;


        console.log(
          "GENERATED CONTENT:"
        );

        console.log(
          generated
        );


        if (
          !generated ||
          typeof generated !==
            "object"
        ) {

          throw new Error(
            "The backend did not return generated_content."
          );
        }


        /* -----------------------------------------------
           THIS IS THE IMPORTANT PART
           
           Directly replace preview state.
        ------------------------------------------------ */

        setGeneratedResume(
          {
            ...generated
          }
        );


        setSuccessMessage(
          "Resume generated successfully. Live preview updated."
        );


      } catch (error) {

        console.error(
          "RESUME BUILDER GENERATE ERROR:",
          error
        );


        if (
          error.response?.status ===
          401
        ) {

          forceLogin();

          return;
        }


        setErrorMessage(

          error.response?.data?.detail ||

          error.message ||

          "Failed to generate resume."
        );

      } finally {

        setGenerating(false);
      }
    };


  /* =======================================================
     SAVE
  ======================================================= */

  const handleSave =
    async () => {

      setSuccessMessage("");

      setErrorMessage("");


      if (!generatedResume) {

        setErrorMessage(
          "Generate the resume before saving."
        );

        return;
      }


      setSaving(true);


      try {

        const token =
          getToken();


        const response =
          await axios.put(

            `${API_BASE}/api/resume-builder/save`,

            {

              source:
                selectedSource,

              template:
                selectedTemplate,

              target_role:
                targetRole,

              generated_content:
                generatedResume,
            },

            {

              headers: {

                Authorization:
                  `Bearer ${token}`,

                "Content-Type":
                  "application/json"
              }

            }
          );


        console.log(
          "SAVE RESPONSE:",
          response.data
        );


        const savedResume =
          response.data
            ?.resume
            ?.generated_content;


        if (
          savedResume &&
          typeof savedResume ===
            "object"
        ) {

          setGeneratedResume(
            {
              ...savedResume
            }
          );
        }


        setSuccessMessage(
          "Resume saved successfully."
        );


      } catch (error) {

        console.error(
          "SAVE ERROR:",
          error
        );


        if (
          error.response?.status ===
          401
        ) {

          forceLogin();

          return;
        }


        setErrorMessage(
          error.response?.data?.detail ||
          error.message ||
          "Failed to save resume."
        );

      } finally {

        setSaving(false);
      }
    };


  /* =======================================================
     LOADING SCREEN
  ======================================================= */

  if (loading) {

    return (
      <div
        style={{
          minHeight:
            "100vh",
          background:
            "#070712",
          color:
            "white",
          display:
            "flex",
          alignItems:
            "center",
          justifyContent:
            "center",
          fontFamily:
            "Arial, Helvetica, sans-serif",
        }}
      >
        Loading Resume Builder...
      </div>
    );
  }


  /* =======================================================
     RENDER
  ======================================================= */

  return (

    <div className="ats-page">

      <style>{`

        * {
          box-sizing: border-box;
        }


        body {
          margin: 0;
        }


        .ats-page {
          min-height: 100vh;

          background:
            radial-gradient(
              circle at top left,
              #1c1734,
              #090812 45%,
              #05050a
            );

          color: white;

          padding: 24px;

          font-family:
            Arial,
            Helvetica,
            sans-serif;
        }


        /* ================================================
           TOP
        ================================================ */

        .ats-topbar {
          max-width: 1500px;

          margin:
            0 auto 20px;

          display: flex;

          align-items: center;

          justify-content:
            space-between;

          gap: 16px;
        }


        .ats-title h1 {
          margin: 0;

          font-size: 28px;

          font-weight: 700;
        }


        .ats-title p {
          margin:
            6px 0 0;

          color:
            #a8a4b4;

          font-size: 14px;
        }


        /* ================================================
           LAYOUT
        ================================================ */

        .ats-layout {
          max-width: 1500px;

          margin: 0 auto;

          display: grid;

          grid-template-columns:
            minmax(380px, 0.9fr)
            minmax(560px, 1.1fr);

          gap: 22px;

          align-items: start;
        }


        /* ================================================
           EDITOR
        ================================================ */

        .editor-card {

          background:
            rgba(
              14,
              13,
              23,
              0.96
            );

          border:
            1px solid #2b2742;

          border-radius:
            18px;

          padding:
            20px;

          box-shadow:
            0 20px 60px
            rgba(
              0,
              0,
              0,
              0.24
            );
        }


        .editor-card h2 {
          margin:
            0 0 18px;

          font-size:
            19px;
        }


        /* ================================================
           SOURCE
        ================================================ */

        .source-grid {

          display: grid;

          grid-template-columns:
            1fr 1fr;

          gap: 10px;

          margin-bottom:
            18px;
        }


        .source-btn {

          background:
            #141222;

          color:
            #c9c5d6;

          border:
            1px solid #393451;

          border-radius:
            10px;

          padding:
            12px;

          cursor:
            pointer;

          font-family:
            inherit;

          font-weight:
            600;
        }


        .source-btn.active {

          background:
            #241b47;

          border-color:
            #8d6eff;

          color:
            white;
        }


        /* ================================================
           TEMPLATES
        ================================================ */

        .template-grid {

          display: grid;

          grid-template-columns:
            repeat(3, 1fr);

          gap: 8px;

          margin-bottom:
            18px;
        }


        .template-btn {

          background:
            #0f0e18;

          color:
            #aaa7b6;

          border:
            1px solid #353149;

          border-radius:
            9px;

          padding:
            10px;

          cursor:
            pointer;

          font-family:
            inherit;
        }


        .template-btn.active {

          background:
            #241b47;

          border-color:
            #8d6eff;

          color:
            white;
        }


        /* ================================================
           LATEST ANALYZED
        ================================================ */

        .latest-box {

          background:
            #10101a;

          border:
            1px solid #2e2a43;

          border-radius:
            11px;

          padding:
            12px;

          margin-bottom:
            16px;
        }


        .latest-box-title {

          font-size:
            13px;

          font-weight:
            700;

          margin-bottom:
            4px;
        }


        .latest-box-info {

          color:
            #aaa6b7;

          font-size:
            12px;

          line-height:
            1.5;
        }


        .latest-actions {

          margin-top:
            9px;

          display:
            flex;

          gap:
            8px;
        }


        /* ================================================
           ROLE
        ================================================ */

        .role-box {
          margin-bottom:
            18px;
        }


        .role-box label {

          display:
            block;

          margin-bottom:
            7px;

          font-size:
            12px;

          color:
            #bbb7c8;
        }


        .role-input {

          width:
            100%;

          padding:
            11px;

          background:
            #0b0a11;

          border:
            1px solid #302c45;

          border-radius:
            9px;

          color:
            white;

          font-family:
            inherit;

          outline:
            none;
        }


        .role-input:focus {
          border-color:
            #8d6eff;
        }


        /* ================================================
           SECTIONS
        ================================================ */

        .editor-section {

          margin-top:
            20px;

          padding-top:
            17px;

          border-top:
            1px solid #2a2740;
        }


        .editor-section-title {

          font-size:
            15px;

          font-weight:
            700;

          margin-bottom:
            12px;
        }


        .editor-grid {

          display:
            grid;

          grid-template-columns:
            repeat(2, 1fr);

          gap:
            11px;
        }


        .cp-full {
          grid-column:
            1 / -1;
        }


        .cp-field {

          display:
            flex;

          flex-direction:
            column;

          gap:
            6px;
        }


        .cp-field label {

          color:
            #bdb9ca;

          font-size:
            12px;
        }


        .cp-field input,
        .cp-field textarea {

          width:
            100%;

          background:
            #0a0910;

          color:
            white;

          border:
            1px solid #302d47;

          border-radius:
            9px;

          padding:
            10px 11px;

          font-family:
            inherit;

          font-size:
            13px;

          outline:
            none;
        }


        .cp-field input:focus,
        .cp-field textarea:focus {

          border-color:
            #8d6eff;
        }


        .cp-field textarea {

          min-height:
            85px;

          resize:
            vertical;
        }


        /* ================================================
           ITEM
        ================================================ */

        .item-editor {

          background:
            #0e0d15;

          border:
            1px solid #29263d;

          border-radius:
            11px;

          padding:
            12px;

          margin-bottom:
            11px;
        }


        .item-head {

          display:
            flex;

          justify-content:
            space-between;

          align-items:
            center;

          margin-bottom:
            10px;
        }


        .item-head span {

          font-size:
            12px;

          color:
            #aaa6b6;
        }


        /* ================================================
           BUTTONS
        ================================================ */

        .small-btn {

          border:
            0;

          border-radius:
            8px;

          padding:
            8px 11px;

          font-family:
            inherit;

          cursor:
            pointer;

          font-size:
            12px;

          font-weight:
            600;
        }


        .secondary-btn {

          background:
            #242036;

          color:
            #ddd9e8;

          border:
            1px solid #373149;

          border-radius:
            9px;

          padding:
            9px 12px;

          font-family:
            inherit;

          cursor:
            pointer;
        }


        .secondary-btn:hover {
          background:
            #302a48;
        }


        .danger-btn {

          background:
            #351c28;

          color:
            #ffbdcd;

          border:
            1px solid #552936;

          border-radius:
            8px;

          padding:
            7px 10px;

          cursor:
            pointer;

          font-family:
            inherit;

          font-size:
            11px;
        }


        .primary-btn {

          width:
            100%;

          border:
            0;

          border-radius:
            10px;

          padding:
            13px;

          margin-top:
            18px;

          background:
            linear-gradient(
              135deg,
              #7659ec,
              #9a5de7
            );

          color:
            white;

          font-family:
            inherit;

          font-size:
            14px;

          font-weight:
            700;

          cursor:
            pointer;
        }


        .primary-btn:disabled {

          opacity:
            0.55;

          cursor:
            not-allowed;
        }


        .action-row {

          display:
            grid;

          grid-template-columns:
            1fr 1fr;

          gap:
            10px;

          margin-top:
            10px;
        }


        .save-btn {

          border:
            1px solid #28513b;

          background:
            #173024;

          color:
            #bff1ce;

          border-radius:
            9px;

          padding:
            11px;

          font-family:
            inherit;

          cursor:
            pointer;

          font-weight:
            600;
        }


        .save-btn:disabled {

          opacity:
            0.5;

          cursor:
            not-allowed;
        }


        /* ================================================
           MESSAGES
        ================================================ */

        .success-message {

          margin-top:
            12px;

          padding:
            10px;

          border-radius:
            9px;

          background:
            #11281b;

          border:
            1px solid #28523a;

          color:
            #c1f4d0;

          font-size:
            12px;
        }


        .error-message {

          margin-top:
            12px;

          padding:
            10px;

          border-radius:
            9px;

          background:
            #31171d;

          border:
            1px solid #5e2a35;

          color:
            #ffc2cb;

          font-size:
            12px;
        }


        /* ================================================
           PREVIEW
        ================================================ */

        .preview-wrap {

          position:
            sticky;

          top:
            20px;
        }


        .preview-header {

          display:
            flex;

          align-items:
            center;

          justify-content:
            space-between;

          margin-bottom:
            10px;
        }


        .preview-header h2 {

          margin:
            0;

          font-size:
            17px;
        }


        .preview-status {

          font-size:
            11px;

          color:
            #aaa6b6;
        }


        .paper-shell {

          background:
            #d5d5da;

          border-radius:
            12px;

          padding:
            20px;

          overflow:
            auto;

          box-shadow:
            0 20px 60px
            rgba(
              0,
              0,
              0,
              0.3
            );
        }


        /* ================================================
           A4 PAPER
        ================================================ */

        .resume-paper {

          width:
            794px;

          min-height:
            1123px;

          margin:
            0 auto;

          background:
            white;

          color:
            #111;

          padding:
            42px 48px;

          font-family:
            Arial,
            Helvetica,
            sans-serif !important;

          font-size:
            10.5px;

          line-height:
            1.35;
        }


        .resume-header {

          text-align:
            center !important;

          padding-bottom:
            8px;

          border-bottom:
            1px solid #111;
        }


        .resume-header h1 {

          margin:
            0 auto 4px;

          width:
            100%;

          text-align:
            center !important;

          font-family:
            Arial,
            Helvetica,
            sans-serif !important;

          font-size:
            23px;

          line-height:
            1.1;

          font-weight:
            700;
        }


        .resume-placeholder {

          color:
            #777;

          font-size:
            10px;

          margin-top:
            15px;
        }


        .resume-contact {

          text-align:
            center !important;

          font-size:
            9.5px;
        }


        .resume-profile-links {

          display:
            flex;

          justify-content:
            center !important;

          align-items:
            center;

          flex-wrap:
            wrap;

          gap:
            9px;

          margin-top:
            3px;

          font-size:
            9px;
        }


        .resume-paper a {

          color:
            #111;

          text-decoration:
            underline;
        }


        .resume-section {

          margin-top:
            9px;
        }


        .resume-section h2 {

          margin:
            0 0 5px;

          font-size:
            10.5px;

          font-weight:
            700;

          letter-spacing:
            0.25px;

          border-bottom:
            1px solid #222;

          padding-bottom:
            2px;
        }


        .resume-summary {

          margin:
            0;

          text-align:
            justify;
        }


        .resume-item {

          margin-bottom:
            6px;
        }


        .resume-item-top {

          display:
            flex;

          align-items:
            baseline;

          justify-content:
            space-between;

          gap:
            10px;
        }


        .resume-muted {

          font-size:
            9.5px;

          color:
            #333;
        }


        .resume-paper ul {

          margin:
            2px 0 0 14px;

          padding:
            0;
        }


        .resume-paper li {

          margin-bottom:
            1.5px;
        }


        .skills-line {
          margin:
            0;
        }


        .resume-project-title {

          display:
            flex;

          justify-content:
            space-between;

          align-items:
            baseline;

          gap:
            10px;
        }


        /* ================================================
           MOBILE
        ================================================ */

        @media (
          max-width: 1100px
        ) {

          .ats-layout {

            grid-template-columns:
              1fr;
          }

          .preview-wrap {

            position:
              static;
          }

        }


        @media (
          max-width: 700px
        ) {

          .ats-page {
            padding:
              12px;
          }

          .editor-grid {
            grid-template-columns:
              1fr;
          }

          .source-grid {
            grid-template-columns:
              1fr;
          }

          .template-grid {
            grid-template-columns:
              1fr;
          }

          .action-row {
            grid-template-columns:
              1fr;
          }

        }


        /* ================================================
           PRINT
        ================================================ */

        @media print {

          body {
            background:
              white;
          }

          .ats-page {
            padding:
              0;

            background:
              white;
          }

          .ats-topbar,
          .editor-card,
          .preview-header {
            display:
              none !important;
          }

          .ats-layout {
            display:
              block;
          }

          .paper-shell {

            padding:
              0;

            background:
              white;

            box-shadow:
              none;
          }

          .resume-paper {

            width:
              794px;

            min-height:
              1123px;
          }

        }

      `}</style>


      {/* ===================================================
          TOPBAR
      =================================================== */}

      <div className="ats-topbar">

        <div className="ats-title">

          <h1>
            ATS Resume Builder
          </h1>

          <p>
            Create and update your
            ATS-friendly resume.
          </p>

        </div>


        <button
          className="secondary-btn"
          onClick={() =>
            navigate(
              "/dashboard"
            )
          }
        >
          Back to Dashboard
        </button>

      </div>


      {/* ===================================================
          MAIN
      =================================================== */}

      <div className="ats-layout">


        {/* =================================================
            LEFT
        ================================================= */}

        <div className="editor-card">

          <h2>
            Resume Builder
          </h2>


          {/* =================================================
              SOURCE
          ================================================= */}

          <div className="source-grid">

            <button
              className={
                `source-btn ${
                  selectedSource ===
                  "previous"
                    ? "active"
                    : ""
                }`
              }
              onClick={() => {

                setSelectedSource(
                  "previous"
                );

                setSuccessMessage("");

                setErrorMessage("");
              }}
            >
              Use Previous Resume
            </button>


            <button
              className={
                `source-btn ${
                  selectedSource ===
                  "manual"
                    ? "active"
                    : ""
                }`
              }
              onClick={() => {

                setSelectedSource(
                  "manual"
                );

                setSuccessMessage("");

                setErrorMessage("");
              }}
            >
              Build Manually
            </button>

          </div>


          {/* =================================================
              TEMPLATE
          ================================================= */}

          <div className="template-grid">

            {[
              "minimal",
              "modern",
              "classic",
            ].map(
              (template) => (

                <button
                  key={
                    template
                  }
                  className={
                    `template-btn ${
                      selectedTemplate ===
                      template
                        ? "active"
                        : ""
                    }`
                  }
                  onClick={() =>
                    setSelectedTemplate(
                      template
                    )
                  }
                >
                  {
                    template
                      .charAt(0)
                      .toUpperCase() +
                    template.slice(1)
                  }
                </button>

              )
            )}

          </div>


          {/* =================================================
              TARGET ROLE
          ================================================= */}

          <div className="role-box">

            <label>
              Target Role
            </label>

            <input
              className="role-input"
              value={
                targetRole
              }
              placeholder="Software Developer"
              onChange={(
                event
              ) =>
                setTargetRole(
                  event.target.value
                )
              }
            />

          </div>


          {/* =================================================
              PREVIOUS RESUME INFO
          ================================================= */}

          {selectedSource ===
            "previous" && (

            <div className="latest-box">

              <div className="latest-box-title">
                Latest Analyzed Resume
              </div>


              {latestAnalyzedResume ? (

                <>

                  <div className="latest-box-info">

                    <strong>
                      {
                        latestAnalyzedResume.filename ||
                        "Resume"
                      }
                    </strong>

                    <br />

                    ATS Score:
                    {" "}
                    {
                      latestAnalyzedResume.analysis?.ats_score ??
                      0
                    }

                    /100

                  </div>


                  <div className="latest-actions">

                    <button
                      className="secondary-btn"
                      onClick={
                        refreshLatestAnalyzedResume
                      }
                    >
                      Refresh Latest
                    </button>

                  </div>

                </>

              ) : (

                <div className="latest-box-info">

                  No analyzed resume found.
                  <br />
                  Please upload a resume in
                  Resume Analyzer first.

                  <div
                    className="latest-actions"
                  >

                    <button
                      className="secondary-btn"
                      onClick={() =>
                        navigate(
                          "/resume-analyzer"
                        )
                      }
                    >
                      Open Resume Analyzer
                    </button>

                  </div>

                </div>

              )}

            </div>

          )}


          {/* =================================================
              MANUAL BUILDER
          ================================================= */}

          {selectedSource ===
            "manual" && (

            <>

              {/* =============================================
                  PERSONAL
              ============================================= */}

              <div className="editor-section">

                <div className="editor-section-title">
                  Personal Information
                </div>


                <div className="editor-grid">

                  <Field
                    label="Name *"
                    value={
                      manualData.name
                    }
                    onChange={(
                      value
                    ) =>
                      updateManualField(
                        "name",
                        value
                      )
                    }
                  />


                  <Field
                    label="Email"
                    value={
                      manualData.email
                    }
                    onChange={(
                      value
                    ) =>
                      updateManualField(
                        "email",
                        value
                      )
                    }
                  />


                  <Field
                    label="Phone"
                    value={
                      manualData.phone
                    }
                    onChange={(
                      value
                    ) =>
                      updateManualField(
                        "phone",
                        value
                      )
                    }
                  />


                  <Field
                    label="Location"
                    value={
                      manualData.location
                    }
                    onChange={(
                      value
                    ) =>
                      updateManualField(
                        "location",
                        value
                      )
                    }
                  />


                  <Field
                    label="LinkedIn"
                    value={
                      manualData.linkedin
                    }
                    placeholder="linkedin.com/in/..."
                    onChange={(
                      value
                    ) =>
                      updateManualField(
                        "linkedin",
                        value
                      )
                    }
                  />


                  <Field
                    label="GitHub"
                    value={
                      manualData.github
                    }
                    placeholder="github.com/..."
                    onChange={(
                      value
                    ) =>
                      updateManualField(
                        "github",
                        value
                      )
                    }
                  />


                  <Field
                    label="Portfolio"
                    value={
                      manualData.portfolio
                    }
                    placeholder="yourportfolio.com"
                    onChange={(
                      value
                    ) =>
                      updateManualField(
                        "portfolio",
                        value
                      )
                    }
                  />

                </div>

              </div>


              {/* =============================================
                  SUMMARY
              ============================================= */}

              <div className="editor-section">

                <div className="editor-section-title">
                  Professional Summary
                </div>

                <TextArea
                  label="Summary"
                  value={
                    manualData.professional_summary
                  }
                  onChange={(
                    value
                  ) =>
                    updateManualField(
                      "professional_summary",
                      value
                    )
                  }
                />

              </div>


              {/* =============================================
                  EDUCATION
              ============================================= */}

              <div className="editor-section">

                <div className="editor-section-title">
                  Education
                </div>


                {manualData.education.map(
                  (
                    item,
                    index
                  ) => (

                    <div
                      className="item-editor"
                      key={index}
                    >

                      <div className="item-head">

                        <span>
                          Education #
                          {index + 1}
                        </span>


                        {manualData
                          .education
                          .length > 1 && (

                          <button
                            className="danger-btn"
                            onClick={() =>
                              removeEducation(
                                index
                              )
                            }
                          >
                            Remove
                          </button>

                        )}

                      </div>


                      <div className="editor-grid">

                        <Field
                          label="Degree / Program"
                          value={
                            item.degree
                          }
                          onChange={(
                            value
                          ) =>
                            updateEducation(
                              index,
                              "degree",
                              value
                            )
                          }
                        />


                        <Field
                          label="Institution"
                          value={
                            item.institution
                          }
                          onChange={(
                            value
                          ) =>
                            updateEducation(
                              index,
                              "institution",
                              value
                            )
                          }
                        />


                        <Field
                          label="Location"
                          value={
                            item.location
                          }
                          onChange={(
                            value
                          ) =>
                            updateEducation(
                              index,
                              "location",
                              value
                            )
                          }
                        />


                        <Field
                          label="Year"
                          value={
                            item.year
                          }
                          onChange={(
                            value
                          ) =>
                            updateEducation(
                              index,
                              "year",
                              value
                            )
                          }
                        />


                        <Field
                          label="CGPA"
                          value={
                            item.cgpa
                          }
                          onChange={(
                            value
                          ) =>
                            updateEducation(
                              index,
                              "cgpa",
                              value
                            )
                          }
                        />


                        <Field
                          label="Percentage"
                          value={
                            item.percentage
                          }
                          onChange={(
                            value
                          ) =>
                            updateEducation(
                              index,
                              "percentage",
                              value
                            )
                          }
                        />

                      </div>

                    </div>

                  )
                )}


                <button
                  className="secondary-btn"
                  onClick={
                    addEducation
                  }
                >
                  + Add Education
                </button>

              </div>


              {/* =============================================
                  INTERNSHIPS
              ============================================= */}

              <div className="editor-section">

                <div className="editor-section-title">
                  Internships
                </div>


                <label
                  style={{
                    display:
                      "flex",
                    alignItems:
                      "center",
                    gap:
                      "8px",
                    fontSize:
                      "12px",
                    color:
                      "#bbb7c8",
                    marginBottom:
                      "12px",
                  }}
                >

                  <input
                    type="checkbox"
                    checked={
                      manualData
                        .internshipEnabled
                    }
                    onChange={(
                      event
                    ) =>
                      updateManualField(
                        "internshipEnabled",
                        event.target.checked
                      )
                    }
                  />

                  Include internships

                </label>


                {manualData
                  .internshipEnabled && (

                  <>

                    {manualData
                      .internships
                      .map(
                        (
                          item,
                          index
                        ) => (

                          <div
                            className="item-editor"
                            key={index}
                          >

                            <div className="item-head">

                              <span>
                                Internship #
                                {index + 1}
                              </span>


                              {manualData
                                .internships
                                .length > 1 && (

                                <button
                                  className="danger-btn"
                                  onClick={() =>
                                    removeInternship(
                                      index
                                    )
                                  }
                                >
                                  Remove
                                </button>

                              )}

                            </div>


                            <div className="editor-grid">

                              <Field
                                label="Role"
                                value={
                                  item.title
                                }
                                onChange={(
                                  value
                                ) =>
                                  updateInternship(
                                    index,
                                    "title",
                                    value
                                  )
                                }
                              />


                              <Field
                                label="Company"
                                value={
                                  item.company
                                }
                                onChange={(
                                  value
                                ) =>
                                  updateInternship(
                                    index,
                                    "company",
                                    value
                                  )
                                }
                              />


                              <Field
                                label="Location"
                                value={
                                  item.location
                                }
                                onChange={(
                                  value
                                ) =>
                                  updateInternship(
                                    index,
                                    "location",
                                    value
                                  )
                                }
                              />


                              <Field
                                label="Duration"
                                value={
                                  item.duration
                                }
                                onChange={(
                                  value
                                ) =>
                                  updateInternship(
                                    index,
                                    "duration",
                                    value
                                  )
                                }
                              />


                              <TextArea
                                label="Description"
                                value={
                                  item.description
                                }
                                onChange={(
                                  value
                                ) =>
                                  updateInternship(
                                    index,
                                    "description",
                                    value
                                  )
                                }
                              />

                            </div>

                          </div>

                        )
                      )}


                    <button
                      className="secondary-btn"
                      onClick={
                        addInternship
                      }
                    >
                      + Add Internship
                    </button>

                  </>

                )}

              </div>


              {/* =============================================
                  EXPERIENCE
              ============================================= */}

              <div className="editor-section">

                <div className="editor-section-title">
                  Experience
                </div>


                <label
                  style={{
                    display:
                      "flex",
                    alignItems:
                      "center",
                    gap:
                      "8px",
                    fontSize:
                      "12px",
                    color:
                      "#bbb7c8",
                    marginBottom:
                      "12px",
                  }}
                >

                  <input
                    type="checkbox"
                    checked={
                      manualData
                        .experienceEnabled
                    }
                    onChange={(
                      event
                    ) =>
                      updateManualField(
                        "experienceEnabled",
                        event.target.checked
                      )
                    }
                  />

                  Include experience

                </label>


                {manualData
                  .experienceEnabled && (

                  <>

                    {manualData
                      .experience
                      .map(
                        (
                          item,
                          index
                        ) => (

                          <div
                            className="item-editor"
                            key={index}
                          >

                            <div className="item-head">

                              <span>
                                Experience #
                                {index + 1}
                              </span>


                              {manualData
                                .experience
                                .length > 1 && (

                                <button
                                  className="danger-btn"
                                  onClick={() =>
                                    removeExperience(
                                      index
                                    )
                                  }
                                >
                                  Remove
                                </button>

                              )}

                            </div>


                            <div className="editor-grid">

                              <Field
                                label="Job Title"
                                value={
                                  item.title
                                }
                                onChange={(
                                  value
                                ) =>
                                  updateExperience(
                                    index,
                                    "title",
                                    value
                                  )
                                }
                              />


                              <Field
                                label="Company"
                                value={
                                  item.company
                                }
                                onChange={(
                                  value
                                ) =>
                                  updateExperience(
                                    index,
                                    "company",
                                    value
                                  )
                                }
                              />


                              <Field
                                label="Location"
                                value={
                                  item.location
                                }
                                onChange={(
                                  value
                                ) =>
                                  updateExperience(
                                    index,
                                    "location",
                                    value
                                  )
                                }
                              />


                              <Field
                                label="Duration"
                                value={
                                  item.duration
                                }
                                onChange={(
                                  value
                                ) =>
                                  updateExperience(
                                    index,
                                    "duration",
                                    value
                                  )
                                }
                              />


                              <TextArea
                                label="Description"
                                value={
                                  item.description
                                }
                                onChange={(
                                  value
                                ) =>
                                  updateExperience(
                                    index,
                                    "description",
                                    value
                                  )
                                }
                              />

                            </div>

                          </div>

                        )
                      )}


                    <button
                      className="secondary-btn"
                      onClick={
                        addExperience
                      }
                    >
                      + Add Experience
                    </button>

                  </>

                )}

              </div>


              {/* =============================================
                  SKILLS
              ============================================= */}

              <div className="editor-section">

                <div className="editor-section-title">
                  Skills
                </div>

                <TextArea
                  label="Skills"
                  value={
                    manualData.skills
                  }
                  placeholder="Python, Java, SQL, React, MongoDB"
                  onChange={(
                    value
                  ) =>
                    updateManualField(
                      "skills",
                      value
                    )
                  }
                />

              </div>


              {/* =============================================
                  PROJECTS
              ============================================= */}

              <div className="editor-section">

                <div className="editor-section-title">
                  Projects
                </div>


                {manualData.projects.map(
                  (
                    item,
                    index
                  ) => (

                    <div
                      className="item-editor"
                      key={index}
                    >

                      <div className="item-head">

                        <span>
                          Project #
                          {index + 1}
                        </span>


                        {manualData
                          .projects
                          .length > 1 && (

                          <button
                            className="danger-btn"
                            onClick={() =>
                              removeProject(
                                index
                              )
                            }
                          >
                            Remove
                          </button>

                        )}

                      </div>


                      <div className="editor-grid">

                        <Field
                          label="Project Title"
                          value={
                            item.title
                          }
                          onChange={(
                            value
                          ) =>
                            updateProject(
                              index,
                              "title",
                              value
                            )
                          }
                        />


                        <Field
                          label="Technologies"
                          value={
                            item.technologies
                          }
                          onChange={(
                            value
                          ) =>
                            updateProject(
                              index,
                              "technologies",
                              value
                            )
                          }
                        />


                        <Field
                          label="Project URL"
                          value={
                            item.url
                          }
                          placeholder="https://..."
                          onChange={(
                            value
                          ) =>
                            updateProject(
                              index,
                              "url",
                              value
                            )
                          }
                        />


                        <TextArea
                          label="Description"
                          value={
                            item.description
                          }
                          onChange={(
                            value
                          ) =>
                            updateProject(
                              index,
                              "description",
                              value
                            )
                          }
                        />

                      </div>

                    </div>

                  )
                )}


                <button
                  className="secondary-btn"
                  onClick={
                    addProject
                  }
                >
                  + Add Project
                </button>

              </div>


              {/* =============================================
                  CERTIFICATIONS
              ============================================= */}

              <div className="editor-section">

                <div className="editor-section-title">
                  Certifications
                </div>


                {manualData
                  .certifications
                  .map(
                    (
                      item,
                      index
                    ) => (

                      <div
                        className="item-editor"
                        key={index}
                      >

                        <div className="item-head">

                          <span>
                            Certification #
                            {index + 1}
                          </span>


                          {manualData
                            .certifications
                            .length > 1 && (

                            <button
                              className="danger-btn"
                              onClick={() =>
                                removeCertification(
                                  index
                                )
                              }
                            >
                              Remove
                            </button>

                          )}

                        </div>


                        <div className="editor-grid">

                          <Field
                            label="Title"
                            value={
                              item.title
                            }
                            onChange={(
                              value
                            ) =>
                              updateCertification(
                                index,
                                "title",
                                value
                              )
                            }
                          />


                          <Field
                            label="Issuer"
                            value={
                              item.issuer
                            }
                            onChange={(
                              value
                            ) =>
                              updateCertification(
                                index,
                                "issuer",
                                value
                              )
                            }
                          />


                          <Field
                            label="Year"
                            value={
                              item.year
                            }
                            onChange={(
                              value
                            ) =>
                              updateCertification(
                                index,
                                "year",
                                value
                              )
                            }
                          />


                          <Field
                            label="Credential URL"
                            value={
                              item.url
                            }
                            placeholder="https://..."
                            onChange={(
                              value
                            ) =>
                              updateCertification(
                                index,
                                "url",
                                value
                              )
                            }
                          />

                        </div>

                      </div>

                    )
                  )}


                <button
                  className="secondary-btn"
                  onClick={
                    addCertification
                  }
                >
                  + Add Certification
                </button>

              </div>


              {/* =============================================
                  ACHIEVEMENTS
              ============================================= */}

              <div className="editor-section">

                <div className="editor-section-title">
                  Achievements
                </div>


                {manualData
                  .achievements
                  .map(
                    (
                      item,
                      index
                    ) => (

                      <div
                        className="item-editor"
                        key={index}
                      >

                        <div className="item-head">

                          <span>
                            Achievement #
                            {index + 1}
                          </span>


                          {manualData
                            .achievements
                            .length > 1 && (

                            <button
                              className="danger-btn"
                              onClick={() =>
                                removeAchievement(
                                  index
                                )
                              }
                            >
                              Remove
                            </button>

                          )}

                        </div>


                        <div className="editor-grid">

                          <Field
                            label="Title"
                            value={
                              item.title
                            }
                            onChange={(
                              value
                            ) =>
                              updateAchievement(
                                index,
                                "title",
                                value
                              )
                            }
                          />


                          <Field
                            label="Organization"
                            value={
                              item.issuer
                            }
                            onChange={(
                              value
                            ) =>
                              updateAchievement(
                                index,
                                "issuer",
                                value
                              )
                            }
                          />


                          <Field
                            label="Year"
                            value={
                              item.year
                            }
                            onChange={(
                              value
                            ) =>
                              updateAchievement(
                                index,
                                "year",
                                value
                              )
                            }
                          />


                          <Field
                            label="Proof URL"
                            value={
                              item.url
                            }
                            placeholder="https://..."
                            onChange={(
                              value
                            ) =>
                              updateAchievement(
                                index,
                                "url",
                                value
                              )
                            }
                          />

                        </div>

                      </div>

                    )
                  )}


                <button
                  className="secondary-btn"
                  onClick={
                    addAchievement
                  }
                >
                  + Add Achievement
                </button>

              </div>

            </>

          )}


          {/* =================================================
              GENERATE
          ================================================= */}

          <button
            className="primary-btn"
            disabled={
              generating ||
              (
                selectedSource ===
                  "previous" &&
                !latestAnalyzedResume
              )
            }
            onClick={
              handleGenerate
            }
          >

            {generating
              ? "Generating..."
              : selectedSource ===
                "previous"
              ? "Update From Latest Resume"
              : "Generate Resume"}

          </button>


          {/* =================================================
              ACTIONS
          ================================================= */}

          <div className="action-row">

            <button
              className="save-btn"
              disabled={
                saving ||
                !generatedResume
              }
              onClick={
                handleSave
              }
            >

              {saving
                ? "Saving..."
                : "Save Resume"}

            </button>


            <button
              className="secondary-btn"
              onClick={() =>
                window.print()
              }
            >
              Print / PDF
            </button>

          </div>


          {/* =================================================
              MESSAGE
          ================================================= */}

          {successMessage && (

            <div className="success-message">
              {successMessage}
            </div>

          )}


          {errorMessage && (

            <div className="error-message">
              {errorMessage}
            </div>

          )}

        </div>


        {/* =================================================
            RIGHT - LIVE PREVIEW
        ================================================= */}

        <div className="preview-wrap">

          <div className="preview-header">

            <h2>
              Live Preview
            </h2>

            <span className="preview-status">

              {generatedResume
                ? "Generated resume"
                : "Waiting for generation"}

            </span>

          </div>


          <div className="paper-shell">

            <ResumePreview
              resume={
                generatedResume
              }
            />

          </div>

        </div>

      </div>

    </div>
  );
}